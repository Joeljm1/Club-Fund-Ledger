import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { useConnection, usePublicClient, useWalletClient } from "wagmi";
import {
  getStudentClubWalletContract,
  studentClubAddressConfigured,
} from "../../contracts/studentClub";
import { fetchReceipt } from "../../lib/receipt";
import {
  errorMessage,
  formatPaise,
  parseAmountToPaise,
  shortAddress,
} from "../../lib/format";
import { useClubs } from "../../hooks/useStudentClubReads";
import { type ClubView, type RequestView } from "../../types/dashboard";

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

async function waitForConfirmedTransaction(
  publicClient: ReturnType<typeof usePublicClient>,
  hash: `0x${string}`,
) {
  if (!publicClient) {
    throw new Error("Public client is not available.");
  }

  await publicClient.waitForTransactionReceipt({ hash });
}

type ActionCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function ActionCard({ title, description, children }: ActionCardProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

type ContractActionFormProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit: (
    contract: ReturnType<typeof getStudentClubWalletContract>,
    account: `0x${string}`,
  ) => Promise<`0x${string}`>;
  submitLabel: string;
};

function ContractActionForm({
  title,
  description,
  children,
  onSubmit,
  submitLabel,
}: ContractActionFormProps) {
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before sending transactions.");
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

    if (walletClient.chain?.id !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    try {
      setIsPending(true);
      const contract = getStudentClubWalletContract(walletClient);
      const hash = await onSubmit(contract, address);
      await waitForConfirmedTransaction(publicClient, hash);
      await queryClient.invalidateQueries({ queryKey: ["studentClub"] });
      setSubmitSuccess("Transaction submitted.");
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <ActionCard title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        {submitSuccess ? <p className="text-sm text-emerald-700">{submitSuccess}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Submitting..." : submitLabel}
        </button>
      </form>
    </ActionCard>
  );
}

type ClubEditLayerProps = {
  club: ClubView;
  onClose: () => void;
};

function ClubEditLayer({ club, onClose }: ClubEditLayerProps) {
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [budgetValue, setBudgetValue] = useState("");
  const [leadAddress, setLeadAddress] = useState<string>(club.lead);
  const [studentAddress, setStudentAddress] = useState("");
  const [isPendingBudget, setIsPendingBudget] = useState(false);
  const [isPendingLead, setIsPendingLead] = useState(false);
  const [isPendingStudent, setIsPendingStudent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    setBudgetValue("");
    setLeadAddress(club.lead);
    setStudentAddress("");
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [club]);

  async function withContractWrite(
    action: () => Promise<`0x${string}`>,
    setPending: (value: boolean) => void,
    successMessage: string,
  ) {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before sending transactions.");
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

    if (walletClient.chain?.id !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    try {
      setPending(true);
      const hash = await action();
      await waitForConfirmedTransaction(publicClient, hash);
      await queryClient.invalidateQueries({ queryKey: ["studentClub"] });
      setSubmitSuccess(successMessage);
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleBudgetUpdate() {
    const increasePaise = parseAmountToPaise(budgetValue);
    if (increasePaise === null || increasePaise <= 0n) {
      setSubmitError("Enter a valid budget increase in rupees.");
      return;
    }

    const updatedBudgetPaise = club.budgetPaise + increasePaise;

    await withContractWrite(async () => {
      const contract = getStudentClubWalletContract(walletClient!);
      return contract.write.setClubBudget([club.id, updatedBudgetPaise], {
        account: address!,
        chain: sepolia,
      });
    }, setIsPendingBudget, "Budget increase submitted.");
  }

  async function handleLeadUpdate() {
    if (!isAddress(leadAddress)) {
      setSubmitError("Enter a valid lead wallet address.");
      return;
    }

    await withContractWrite(async () => {
      const contract = getStudentClubWalletContract(walletClient!);
      return contract.write.setClubLead([club.id, leadAddress.trim() as `0x${string}`], {
        account: address!,
        chain: sepolia,
      });
    }, setIsPendingLead, "Lead update submitted.");
  }

  async function handleAddStudent() {
    if (!isAddress(studentAddress)) {
      setSubmitError("Enter a valid student wallet address.");
      return;
    }

    await withContractWrite(async () => {
      const contract = getStudentClubWalletContract(walletClient!);
      return contract.write.addStudentToClub(
        [club.id, studentAddress.trim() as `0x${string}`],
        {
          account: address!,
          chain: sepolia,
        },
      );
    }, setIsPendingStudent, "Student add submitted.");
    setStudentAddress("");
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
              Edit club #{club.id.toString()}
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">{club.name}</h3>
            <p className="mt-2 text-sm text-slate-500 break-all">{club.lead}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-950">Increase budget</div>
            <p className="mt-1 text-sm text-slate-500">
              Add more budget in rupees on top of the current allocation.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Current budget: <span className="font-semibold">{formatPaise(club.budgetPaise)}</span>
            </p>
            <input
              type="text"
              value={budgetValue}
              onChange={(event) => setBudgetValue(event.target.value)}
              placeholder="Increase amount in rupees"
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={handleBudgetUpdate}
              disabled={isPendingBudget}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPendingBudget ? "Submitting..." : "Increase budget"}
            </button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-950">Set lead</div>
            <p className="mt-1 text-sm text-slate-500">
              Change the club lead wallet address.
            </p>
            <input
              type="text"
              value={leadAddress}
              onChange={(event) => setLeadAddress(event.target.value)}
              placeholder="Lead wallet address"
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={handleLeadUpdate}
              disabled={isPendingLead}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPendingLead ? "Submitting..." : "Save lead"}
            </button>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-sm font-semibold text-slate-950">Add student</div>
          <p className="mt-1 text-sm text-slate-500">
            Register a new student wallet under this club.
          </p>
          <input
            type="text"
            value={studentAddress}
            onChange={(event) => setStudentAddress(event.target.value)}
            placeholder="Student wallet address"
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
          <button
            type="button"
            onClick={handleAddStudent}
            disabled={isPendingStudent}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPendingStudent ? "Submitting..." : "Add student"}
          </button>
        </section>

        {submitError ? <p className="mt-5 text-sm text-red-600">{submitError}</p> : null}
        {submitSuccess ? (
          <p className="mt-5 text-sm text-emerald-700">{submitSuccess}</p>
        ) : null}
      </div>
    </div>
  );
}

type AdminContractActionsProps = {
  selectedRequest?: RequestView | null;
  onCloseSelectedRequest: () => void;
};

export function AdminContractActions({
  selectedRequest,
  onCloseSelectedRequest,
}: AdminContractActionsProps) {
  const { clubs, isLoadingClubs } = useClubs();
  const [adminAddress, setAdminAddress] = useState("");
  const [adminApproved, setAdminApproved] = useState(true);

  const [clubName, setClubName] = useState("");
  const [clubLead, setClubLead] = useState("");
  const [clubBudget, setClubBudget] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubView | null>(null);

  const [removeStudentAddress, setRemoveStudentAddress] = useState("");

  const [payoutReference, setPayoutReference] = useState("");

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <ContractActionForm
          title="Set admin"
          description="Grant or revoke admin rights for a wallet."
          submitLabel="Update admin"
          onSubmit={async (contract, account) => {
            if (!isAddress(adminAddress)) {
              throw new Error("Enter a valid wallet address.");
            }

            return contract.write.setAdmin(
              [adminAddress.trim() as `0x${string}`, adminApproved],
              { account, chain: sepolia },
            );
          }}
        >
          <input
            type="text"
            value={adminAddress}
            onChange={(event) => setAdminAddress(event.target.value)}
            placeholder="Wallet address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={adminApproved}
              onChange={(event) => setAdminApproved(event.target.checked)}
            />
            Admin approved
          </label>
        </ContractActionForm>

        <ContractActionForm
          title="Create club"
          description="Create a new club with a lead and a budget."
          submitLabel="Create club"
          onSubmit={async (contract, account) => {
            const budgetPaise = parseAmountToPaise(clubBudget);
            if (!clubName.trim()) {
              throw new Error("Enter a club name.");
            }
            if (!isAddress(clubLead)) {
              throw new Error("Enter a valid lead wallet address.");
            }
            if (budgetPaise === null || budgetPaise <= 0n) {
              throw new Error("Enter a valid budget in rupees.");
            }

            return contract.write.createClub(
              [clubName.trim(), clubLead.trim() as `0x${string}`, budgetPaise],
              { account, chain: sepolia },
            );
          }}
        >
          <input
            type="text"
            value={clubName}
            onChange={(event) => setClubName(event.target.value)}
            placeholder="Club name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="text"
            value={clubLead}
            onChange={(event) => setClubLead(event.target.value)}
            placeholder="Lead wallet address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="text"
            value={clubBudget}
            onChange={(event) => setClubBudget(event.target.value)}
            placeholder="Budget in rupees"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </ContractActionForm>

        <ActionCard
          title="Manage clubs"
          description="Review club name, budget, and lead, then open a layer to edit one club at a time."
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-4 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <div>Club</div>
              <div>Budget</div>
              <div>Lead</div>
              <div>Action</div>
            </div>

            {isLoadingClubs ? (
              <div className="px-4 py-6 text-sm text-slate-500">Loading clubs...</div>
            ) : clubs.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No clubs available yet.
              </div>
            ) : (
              clubs.map((club) => (
                <div
                  key={club.id.toString()}
                  className="grid grid-cols-[1.2fr_1fr_1.4fr_auto] gap-4 border-t border-slate-200 px-4 py-4 text-sm text-slate-700"
                >
                  <div>
                    <div className="font-semibold text-slate-950">{club.name}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                      Club #{club.id.toString()}
                    </div>
                  </div>
                  <div className="font-medium text-slate-950">
                    {formatPaise(club.budgetPaise)}
                  </div>
                  <div className="break-all">{club.lead}</div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedClub(club)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ActionCard>

        <ContractActionForm
          title="Remove student from club"
          description="Deactivate a student profile."
          submitLabel="Remove student"
          onSubmit={async (contract, account) => {
            if (!isAddress(removeStudentAddress)) {
              throw new Error("Enter a valid student wallet address.");
            }

            return contract.write.removeStudentFromClub(
              [removeStudentAddress.trim() as `0x${string}`],
              { account, chain: sepolia },
            );
          }}
        >
          <input
            type="text"
            value={removeStudentAddress}
            onChange={(event) => setRemoveStudentAddress(event.target.value)}
            placeholder="Student wallet address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </ContractActionForm>

        <ActionCard
          title="Disburse request"
          description="Use the Approved requests table above to open a disbursal layer for a selected request."
        >
          <input
            type="text"
            value={payoutReference}
            onChange={(event) => setPayoutReference(event.target.value)}
            placeholder="Default payout reference"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <p className="mt-3 text-sm text-slate-500">
            Select an approved request from the table to disburse it.
          </p>
        </ActionCard>
      </div>

      {selectedClub ? (
        <ClubEditLayer club={selectedClub} onClose={() => setSelectedClub(null)} />
      ) : null}
      {selectedRequest ? (
        <DisburseRequestLayer
          request={selectedRequest}
          initialPayoutReference={payoutReference}
          onClose={onCloseSelectedRequest}
        />
      ) : null}
    </>
  );
}

type DisburseRequestLayerProps = {
  request: RequestView;
  initialPayoutReference: string;
  onClose: () => void;
};

function DisburseRequestLayer({
  request,
  initialPayoutReference,
  onClose,
}: DisburseRequestLayerProps) {
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [payoutReference, setPayoutReference] = useState(initialPayoutReference);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setPayoutReference(initialPayoutReference);
    setSubmitError(null);
  }, [initialPayoutReference, request]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before sending transactions.");
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

    if (walletClient.chain?.id !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    if (!payoutReference.trim()) {
      setSubmitError("Enter a payout reference.");
      return;
    }

    try {
      setIsPending(true);
      const contract = getStudentClubWalletContract(walletClient);
      const hash = await contract.write.disburseRequest(
        [request.id, payoutReference.trim()],
        { account: address, chain: sepolia },
      );
      await waitForConfirmedTransaction(publicClient, hash);
      await queryClient.invalidateQueries({ queryKey: ["studentClub"] });
      onClose();
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
              Disburse Request
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">
              Request #{request.id.toString()}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Finalize this approved request and attach a payout reference.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Club</div>
            <div className="mt-2 font-medium text-slate-950">#{request.clubId.toString()}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Amount</div>
            <div className="mt-2 font-medium text-slate-950">
              {formatPaise(request.amountPaise)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Student</div>
            <div className="mt-2 font-medium text-slate-950">
              {shortAddress(request.student)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Purpose</div>
            <div className="mt-2 font-medium text-slate-950">{request.purpose}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <input
            type="text"
            value={payoutReference}
            onChange={(event) => setPayoutReference(event.target.value)}
            placeholder="Payout reference"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Submitting..." : "Disburse request"}
          </button>
        </form>
      </div>
    </div>
  );
}

type LeadContractActionsProps = {
  selectedRequest?: RequestView | null;
  onClose: () => void;
};

export function LeadContractActions({
  selectedRequest,
  onClose,
}: LeadContractActionsProps) {
  const [reviewRequestId, setReviewRequestId] = useState("");
  const [reviewDecision, setReviewDecision] = useState<"approve" | "deny">("approve");
  const [reviewNote, setReviewNote] = useState("");
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const receiptQuery = useQuery({
    queryKey: ["receipt", selectedRequest?.receiptId],
    queryFn: () => fetchReceipt(selectedRequest!.receiptId),
    enabled: Boolean(selectedRequest && /^\d+$/.test(selectedRequest.receiptId)),
  });

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    setReviewRequestId(selectedRequest.id.toString());
    setReviewNote(selectedRequest.leadNote);
    setReviewDecision(selectedRequest.status === 2n ? "deny" : "approve");
  }, [selectedRequest]);

  if (!selectedRequest) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before sending transactions.");
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

    if (walletClient.chain?.id !== sepolia.id) {
      setSubmitError("Switch MetaMask to the Sepolia network.");
      return;
    }

    try {
      setIsPending(true);
      const contract = getStudentClubWalletContract(walletClient);
      const requestId = reviewRequestId.trim() ? BigInt(reviewRequestId) : null;
      if (!requestId) {
        throw new Error("Enter a valid request ID.");
      }

      const hash = await contract.write.reviewRequest(
        [requestId, reviewDecision === "approve", reviewNote.trim()],
        { account: address, chain: sepolia },
      );
      await waitForConfirmedTransaction(publicClient, hash);
      await queryClient.invalidateQueries({ queryKey: ["studentClub"] });
      setSubmitSuccess("Review submitted.");
      onClose();
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
              Review Request
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">
              Request #{selectedRequest.id.toString()}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Check the receipt, note, and decision before submitting as club lead.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-950">Receipt</div>
            <p className="mt-1 text-sm text-slate-500">
              Uploaded proof file for this expense request.
            </p>

            {receiptQuery.isLoading ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Loading receipt...
              </div>
            ) : receiptQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Receipt file could not be loaded from the backend.
              </div>
            ) : receiptQuery.data ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {receiptQuery.data.mime_type.startsWith("image/") ? (
                  <img
                    src={receiptQuery.data.url}
                    alt={`Receipt ${selectedRequest.receiptId}`}
                    className="max-h-[28rem] w-full object-contain bg-slate-100"
                  />
                ) : receiptQuery.data.mime_type === "application/pdf" ? (
                  <iframe
                    src={receiptQuery.data.url}
                    title={`Receipt ${selectedRequest.receiptId}`}
                    className="h-[28rem] w-full bg-white"
                  />
                ) : (
                  <div className="px-4 py-6 text-sm text-slate-600">
                    Preview is not available for this file type. Open the receipt file
                    directly.
                  </div>
                )}
                <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-950">
                    {receiptQuery.data.original_name}
                  </div>
                  <div className="mt-1">
                    {receiptQuery.data.mime_type} • {receiptQuery.data.size_bytes} bytes
                  </div>
                  <a
                    href={receiptQuery.data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-orange-700 underline"
                  >
                    Open receipt file
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Receipt preview is unavailable for this request.
              </div>
            )}
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm font-semibold text-slate-950">Decision</div>
            <p className="mt-1 text-sm text-slate-500">
              Approve or deny this request and store an optional lead note onchain.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  Club
                </div>
                <div className="mt-2 font-medium text-slate-950">
                  #{selectedRequest.clubId.toString()}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  Amount
                </div>
                <div className="mt-2 font-medium text-slate-950">
                  {formatPaise(selectedRequest.amountPaise)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  Student
                </div>
                <div className="mt-2 font-medium text-slate-950">
                  {shortAddress(selectedRequest.student)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                  Receipt ID
                </div>
                <div className="mt-2 font-medium text-slate-950">
                  {selectedRequest.receiptId}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3 text-sm text-slate-600">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                Purpose
              </div>
              <div className="mt-2 font-medium text-slate-950">
                {selectedRequest.purpose}
              </div>
            </div>

            <input
              type="text"
              value={reviewRequestId}
              onChange={(event) => setReviewRequestId(event.target.value)}
              placeholder="Request ID"
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />

            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-slate-700">Decision</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision("approve")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    reviewDecision === "approve"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("deny")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                    reviewDecision === "deny"
                      ? "border-red-600 bg-red-50 text-red-700"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  Deny
                </button>
              </div>
            </div>

            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Lead note"
              className="mt-4 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />

            {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
            {submitSuccess ? (
              <p className="mt-4 text-sm text-emerald-700">{submitSuccess}</p>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPending ? "Submitting..." : "Submit review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
