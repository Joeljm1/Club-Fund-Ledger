import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useConnection,
  useChainId,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  WagmiProvider,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { config } from "./config";
import { HeaderBar } from "./components/dashboard/HeaderBar";
import { HeroSection } from "./components/dashboard/HeroSection";
import { SessionCard } from "./components/dashboard/SessionCard";
import { NetworkAlert } from "./components/dashboard/NetworkAlert";
import { ClubsSection } from "./components/dashboard/ClubsSection";
import { SubmitExpenseSection } from "./components/dashboard/SubmitExpenseSection";
import { ContractDebugSection } from "./components/dashboard/ContractDebugSection";
import { StudentProfileSection } from "./components/dashboard/StudentProfileSection";
import { RequestsSection } from "./components/dashboard/RequestsSection";
import {
  studentClubAbi,
  studentClubAddress,
  studentClubAddressConfigured,
} from "./contracts/studentClub";
import { errorMessage, parseAmountToPaise } from "./lib/format";
import {
  type ClubResult,
  type ClubView,
  type RequestResult,
  type RequestView,
  type StudentProfileResult,
} from "./types/dashboard";
import AddClub from "./components/dashboard/AddClub";

const client = new QueryClient();

function Dashboard() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const {
    mutateAsync: switchChain,
    error: switchChainError,
    isPending: isSwitchingChain,
  } = useSwitchChain();
  const {
    mutateAsync: writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
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
  const [receiptIdInput, setReceiptIdInput] = useState("");
  const [receiptHashInput, setReceiptHashInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const networkLabel =
    chainId === sepolia.id
      ? "Sepolia"
      : isConnected
        ? `Chain ${chainId}`
        : "Offline";

  const { data: isAdmin, refetch: refetchIsAdmin } = useReadContract({
    abi: studentClubAbi,
    address: studentClubAddress,
    functionName: "isAdmin",
    args: address ? [address] : undefined,
    query: {
      enabled: studentClubAddressConfigured && Boolean(address),
    },
  });

  const {
    data: clubIdsData,
    isLoading: isLoadingClubIds,
    refetch: refetchClubIds,
  } = useReadContract({
    abi: studentClubAbi,
    address: studentClubAddress,
    functionName: "getClubIds",
    query: {
      enabled: studentClubAddressConfigured,
    },
  });

  const clubIds = (clubIdsData as readonly bigint[] | undefined) ?? [];

  const {
    data: clubsData,
    isLoading: isLoadingClubs,
    refetch: refetchClubs,
  } = useReadContracts({
    contracts: clubIds.map((clubId) => ({
      abi: studentClubAbi,
      address: studentClubAddress,
      functionName: "getClub",
      args: [clubId],
    })),
    query: {
      enabled: studentClubAddressConfigured && clubIds.length > 0,
    },
  });

  const clubs: ClubView[] =
    clubsData?.flatMap((item, index) => {
      if (item.status !== "success") {
        return [];
      }

      const [name, lead, budgetPaise, reservedPaise, spentPaise, active] =
        item.result as ClubResult;

      return [
        {
          id: clubIds[index],
          name,
          lead,
          budgetPaise,
          reservedPaise,
          spentPaise,
          active,
        },
      ];
    }) ?? [];

  const { data: studentProfileData, refetch: refetchStudentProfile } =
    useReadContract({
      abi: studentClubAbi,
      address: studentClubAddress,
      functionName: "getStudentProfile",
      args: address ? [address] : undefined,
      query: {
        enabled: studentClubAddressConfigured && Boolean(address),
      },
    });

  const studentProfile = studentProfileData as StudentProfileResult | undefined;
  const activeClubId = studentProfile?.[0] ?? 0n;
  const isRegisteredStudent = studentProfile?.[1] ?? false;

  const { data: requestIdsData, refetch: refetchRequestIds } = useReadContract({
    abi: studentClubAbi,
    address: studentClubAddress,
    functionName: "getStudentRequestIds",
    args: address ? [address] : undefined,
    query: {
      enabled: studentClubAddressConfigured && Boolean(address),
    },
  });

  const requestIds = (requestIdsData as readonly bigint[] | undefined) ?? [];

  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useReadContracts({
    contracts: requestIds.map((requestId) => ({
      abi: studentClubAbi,
      address: studentClubAddress,
      functionName: "getRequest",
      args: [requestId],
    })),
    query: {
      enabled: studentClubAddressConfigured && requestIds.length > 0,
    },
  });

  const requests: RequestView[] =
    requestsData?.flatMap((item, index) => {
      if (item.status !== "success") {
        return [];
      }

      const [
        clubId,
        student,
        amountPaise,
        purpose,
        receiptId,
        receiptHash,
        status,
        leadNote,
        payoutReference,
      ] = item.result as RequestResult;

      return [
        {
          id: requestIds[index],
          clubId,
          student,
          amountPaise,
          purpose,
          receiptId,
          receiptHash,
          status,
          leadNote,
          payoutReference,
        },
      ];
    }) ?? [];

  useEffect(() => {
    if (!isConfirmed) {
      return;
    }

    setAmountInput("");
    setPurposeInput("");
    setReceiptIdInput("");
    setReceiptHashInput("");
    setSubmitError(null);
    void refetchIsAdmin();
    void refetchClubIds();
    void refetchClubs();
    void refetchStudentProfile();
    void refetchRequestIds();
    void refetchRequests();
  }, [
    isConfirmed,
    refetchClubIds,
    refetchClubs,
    refetchIsAdmin,
    refetchRequestIds,
    refetchRequests,
    refetchStudentProfile,
  ]);

  useEffect(() => {
    if (!activeClubId || activeClubId === 0n) {
      return;
    }

    setClubIdInput((current) => current || activeClubId.toString());
  }, [activeClubId]);

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

    if (chainId !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    const clubId = clubIdInput.trim() ? BigInt(clubIdInput) : null;
    const amountPaise = parseAmountToPaise(amountInput);

    if (!clubId) {
      setSubmitError("Enter a valid club ID.");
      return;
    }

    if (amountPaise === null || amountPaise <= 0n) {
      setSubmitError("Enter an amount in rupees, up to two decimals.");
      return;
    }

    if (
      !purposeInput.trim() ||
      !receiptIdInput.trim() ||
      !receiptHashInput.trim()
    ) {
      setSubmitError("Purpose, receipt ID, and receipt hash are required.");
      return;
    }

    try {
      await writeContract({
        abi: studentClubAbi,
        address: studentClubAddress,
        functionName: "submitExpenseRequest",
        args: [
          clubId,
          amountPaise,
          purposeInput.trim(),
          receiptIdInput.trim(),
          receiptHashInput.trim(),
        ],
      });
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    }
  }

  async function handleSwitchToSepolia() {
    setSubmitError(null);

    try {
      await switchChain({ chainId: sepolia.id });
    } catch (error) {
      setSubmitError(
        errorMessage(error) ??
          errorMessage(switchChainError) ??
          "Network switch failed.",
      );
    }
  }

  const selectedClub = clubs.find(
    (club) => club.id.toString() === clubIdInput.trim(),
  );
  const txState = isPending
    ? "Awaiting wallet"
    : isConfirming
      ? "Confirming"
      : isConfirmed
        ? "Confirmed"
        : "Idle";
  const combinedSubmitError =
    submitError ?? errorMessage(writeError) ?? errorMessage(switchChainError);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_36%,_#f8fafc_100%)]">
      <HeaderBar address={address} networkLabel={networkLabel} />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <HeroSection
            clubsCount={clubs.length}
            isAdmin={isAdmin}
            isRegisteredStudent={isRegisteredStudent}
            activeClubId={activeClubId}
          />
          <SessionCard
            address={address}
            isConnected={isConnected}
            networkLabel={networkLabel}
            txState={txState}
            hash={hash}
          />
        </div>

        {!studentClubAddressConfigured ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            `VITE_STUDENT_CLUB_ADDRESS` is not configured, so contract reads and
            writes are disabled.
          </div>
        ) : null}

        {isConnected && chainId !== sepolia.id ? (
          <NetworkAlert
            chainId={chainId}
            isSwitchingChain={isSwitchingChain}
            onSwitch={() => void handleSwitchToSepolia()}
          />
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <ClubsSection
            clubs={clubs}
            isLoading={isLoadingClubIds || isLoadingClubs}
          />
          <SubmitExpenseSection
            activeClubId={activeClubId}
            amountInput={amountInput}
            chainId={chainId}
            clubIdInput={clubIdInput}
            isConnected={isConnected}
            isConfirmed={isConfirmed}
            isConfirming={isConfirming}
            isPending={isPending}
            purposeInput={purposeInput}
            receiptHashInput={receiptHashInput}
            receiptIdInput={receiptIdInput}
            selectedClub={selectedClub}
            submitError={combinedSubmitError}
            onAmountChange={setAmountInput}
            onClubIdChange={setClubIdInput}
            onPurposeChange={setPurposeInput}
            onReceiptHashChange={setReceiptHashInput}
            onReceiptIdChange={setReceiptIdInput}
            onSubmit={handleSubmitExpense}
          />
        </div>

        <ContractDebugSection
          address={address}
          chainId={chainId}
          isAdmin={isAdmin}
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <StudentProfileSection
            activeClubId={activeClubId}
            isAdmin={isAdmin}
            isRegisteredStudent={isRegisteredStudent}
          />
          <RequestsSection isLoading={isLoadingRequests} requests={requests} />
        </div>
        {isAdmin ? <AddClub /> : ""}
      </section>
    </main>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <Dashboard />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
