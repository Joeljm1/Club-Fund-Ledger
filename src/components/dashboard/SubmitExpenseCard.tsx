import { useEffect, useState } from "react";
import { sepolia } from "viem/chains";
import {
  useChainId,
  useConnection,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";
import { SubmitExpenseSection } from "./SubmitExpenseSection";
import {
  getStudentClubWalletContract,
  studentClubAddressConfigured,
} from "../../contracts/studentClub";
import { useClubs, useRequests, useStudentProfile } from "../../hooks/useStudentClubReads";
import { errorMessage, parseAmountToPaise } from "../../lib/format";
import { computeReceiptSha256, uploadReceipt } from "../../lib/receipt";

export function SubmitExpenseCard() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [writeError, setWriteError] = useState<unknown>(null);
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: Boolean(hash),
      },
    });

  const [clubIdInput, setClubIdInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [purposeInput, setPurposeInput] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadedReceiptId, setUploadedReceiptId] = useState<string | null>(null);
  const [uploadedReceiptHash, setUploadedReceiptHash] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { clubs } = useClubs();
  const { activeClubId, refetchStudentProfile } = useStudentProfile(address);
  const { refetchRequestIds, refetchRequests } = useRequests(address);

  useEffect(() => {
    if (!isConfirmed) {
      return;
    }

    setAmountInput("");
    setPurposeInput("");
    setReceiptFile(null);
    setUploadedReceiptId(null);
    setUploadedReceiptHash(null);
    setSubmitError(null);
    void refetchStudentProfile();
    void refetchRequestIds();
    void refetchRequests();
  }, [isConfirmed, refetchRequestIds, refetchRequests, refetchStudentProfile]);

  useEffect(() => {
    if (!activeClubId || activeClubId === 0n) {
      return;
    }

    setClubIdInput((current) => current || activeClubId.toString());
  }, [activeClubId]);

  const selectableClubs =
    activeClubId > 0n
      ? clubs.filter((club) => club.id === activeClubId)
      : clubs.filter((club) => club.active);

  async function handleSubmitExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before submitting.");
      return;
    }

    if (!isConnected || !address) {
      setSubmitError("Connect MetaMask first.");
      return;
    }

    if (!walletClient) {
      setSubmitError("Wallet client is not available.");
      return;
    }

    if (chainId !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    const clubId = clubIdInput.trim() ? BigInt(clubIdInput) : null;
    const amountPaise = parseAmountToPaise(amountInput);

    if (!clubId) {
      setSubmitError("Select a club.");
      return;
    }

    if (amountPaise === null || amountPaise <= 0n) {
      setSubmitError("Enter an amount in rupees, up to two decimals.");
      return;
    }

    if (
      !purposeInput.trim()
    ) {
      setSubmitError("Purpose is required.");
      return;
    }

    if (!receiptFile) {
      setSubmitError("Upload a receipt or proof file.");
      return;
    }

    try {
      setIsPending(true);
      setWriteError(null);
      const sha256 = await computeReceiptSha256(receiptFile);
      const storedReceipt = await uploadReceipt(receiptFile, sha256);
      setUploadedReceiptId(String(storedReceipt.id));
      setUploadedReceiptHash(storedReceipt.sha256);

      const studentClubContract = getStudentClubWalletContract(walletClient);
      const nextHash = await studentClubContract.write.submitExpenseRequest(
        [
          clubId,
          amountPaise,
          purposeInput.trim(),
          String(storedReceipt.id),
          storedReceipt.sha256,
        ],
        { account: address, chain: sepolia },
      );
      setHash(nextHash);
    } catch (error) {
      setWriteError(error);
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setIsPending(false);
    }
  }

  const selectedClub = clubs.find(
    (club) => club.id.toString() === clubIdInput.trim(),
  );
  const combinedSubmitError = submitError ?? errorMessage(writeError);

  return (
    <div className="space-y-4">
      <SubmitExpenseSection
        activeClubId={activeClubId}
        amountInput={amountInput}
        chainId={chainId}
        clubIdInput={clubIdInput}
        clubOptions={selectableClubs}
        isConnected={isConnected}
        isConfirmed={isConfirmed}
        isConfirming={isConfirming}
        isPending={isPending}
        purposeInput={purposeInput}
        receiptHash={uploadedReceiptHash}
        receiptId={uploadedReceiptId}
        receiptName={receiptFile?.name ?? ""}
        selectedClub={selectedClub}
        submitError={combinedSubmitError}
        onAmountChange={setAmountInput}
        onClubIdChange={setClubIdInput}
        onPurposeChange={setPurposeInput}
        onReceiptFileChange={setReceiptFile}
        onSubmit={handleSubmitExpense}
      />
    </div>
  );
}
