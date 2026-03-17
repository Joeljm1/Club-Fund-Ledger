import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { useConnection, useWalletClient } from "wagmi";
import {
  getStudentClubWalletContract,
  studentClubAddressConfigured,
} from "../../contracts/studentClub";
import { errorMessage, formatPaise, parseAmountToPaise } from "../../lib/format";
import { useClubs } from "../../hooks/useStudentClubReads";
import { type ClubView, type RequestView } from "../../types/dashboard";

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function formatPaiseInput(value: bigint) {
  const rupees = value / 100n;
  const paise = value % 100n;

  if (paise === 0n) {
    return rupees.toString();
  }

  return `${rupees.toString()}.${paise.toString().padStart(2, "0")}`;
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
  ) => Promise<void>;
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
      await onSubmit(contract, address);
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
  const queryClient = useQueryClient();
  const [budgetValue, setBudgetValue] = useState(() => formatPaiseInput(club.budgetPaise));
  const [leadAddress, setLeadAddress] = useState<string>(club.lead);
  const [studentAddress, setStudentAddress] = useState("");
  const [isPendingBudget, setIsPendingBudget] = useState(false);
  const [isPendingLead, setIsPendingLead] = useState(false);
  const [isPendingStudent, setIsPendingStudent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    setBudgetValue(formatPaiseInput(club.budgetPaise));
    setLeadAddress(club.lead);
    setStudentAddress("");
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [club]);

  async function withContractWrite(
    action: () => Promise<void>,
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
      await action();
      await queryClient.invalidateQueries({ queryKey: ["studentClub"] });
      setSubmitSuccess(successMessage);
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Transaction failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleBudgetUpdate() {
    const budgetPaise = parseAmountToPaise(budgetValue);
    if (budgetPaise === null || budgetPaise <= 0n) {
      setSubmitError("Enter a valid budget in rupees.");
      return;
    }

    await withContractWrite(async () => {
      const contract = getStudentClubWalletContract(walletClient!);
      await contract.write.setClubBudget([club.id, budgetPaise], {
        account: address!,
        chain: sepolia,
      });
    }, setIsPendingBudget, "Budget update submitted.");
  }

  async function handleLeadUpdate() {
    if (!isAddress(leadAddress)) {
      setSubmitError("Enter a valid lead wallet address.");
      return;
    }

    await withContractWrite(async () => {
      const contract = getStudentClubWalletContract(walletClient!);
      await contract.write.setClubLead([club.id, leadAddress.trim() as `0x${string}`], {
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
      await contract.write.addStudentToClub(
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
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
            <div className="text-sm font-semibold text-slate-950">Set budget</div>
            <p className="mt-1 text-sm text-slate-500">
              Update the club budget in rupees.
            </p>
            <input
              type="text"
              value={budgetValue}
              onChange={(event) => setBudgetValue(event.target.value)}
              placeholder="Budget in rupees"
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            />
            <button
              type="button"
              onClick={handleBudgetUpdate}
              disabled={isPendingBudget}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isPendingBudget ? "Submitting..." : "Save budget"}
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
};

export function AdminContractActions({
  selectedRequest,
}: AdminContractActionsProps) {
  const { clubs, isLoadingClubs } = useClubs();
  const [adminAddress, setAdminAddress] = useState("");
  const [adminApproved, setAdminApproved] = useState(true);

  const [clubName, setClubName] = useState("");
  const [clubLead, setClubLead] = useState("");
  const [clubBudget, setClubBudget] = useState("");
  const [selectedClub, setSelectedClub] = useState<ClubView | null>(null);

  const [removeStudentAddress, setRemoveStudentAddress] = useState("");

  const [disburseRequestId, setDisburseRequestId] = useState("");
  const [payoutReference, setPayoutReference] = useState("");

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    setDisburseRequestId(selectedRequest.id.toString());
  }, [selectedRequest]);

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

            await contract.write.setAdmin(
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

            await contract.write.createClub(
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

            await contract.write.removeStudentFromClub(
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

        <ContractActionForm
          title="Disburse request"
          description="Finalize an approved request and attach a payout reference."
          submitLabel="Disburse request"
          onSubmit={async (contract, account) => {
            const requestId = disburseRequestId.trim()
              ? BigInt(disburseRequestId)
              : null;
            if (!requestId) {
              throw new Error("Enter a valid request ID.");
            }
            if (!payoutReference.trim()) {
              throw new Error("Enter a payout reference.");
            }

            await contract.write.disburseRequest(
              [requestId, payoutReference.trim()],
              { account, chain: sepolia },
            );
          }}
        >
          <input
            type="text"
            value={disburseRequestId}
            onChange={(event) => setDisburseRequestId(event.target.value)}
            placeholder="Request ID"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            type="text"
            value={payoutReference}
            onChange={(event) => setPayoutReference(event.target.value)}
            placeholder="Payout reference"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </ContractActionForm>
      </div>

      {selectedClub ? (
        <ClubEditLayer club={selectedClub} onClose={() => setSelectedClub(null)} />
      ) : null}
    </>
  );
}

type LeadContractActionsProps = {
  selectedRequest?: RequestView | null;
};

export function LeadContractActions({
  selectedRequest,
}: LeadContractActionsProps) {
  const [reviewRequestId, setReviewRequestId] = useState("");
  const [reviewApprove, setReviewApprove] = useState(true);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    if (!selectedRequest) {
      return;
    }

    setReviewRequestId(selectedRequest.id.toString());
    setReviewNote(selectedRequest.leadNote);
    setReviewApprove(selectedRequest.status === 0n);
  }, [selectedRequest]);

  return (
    <div className="grid gap-6">
      <ContractActionForm
        title="Review request"
        description="Approve or reject a submitted expense request as the club lead."
        submitLabel="Review request"
        onSubmit={async (contract, account) => {
          const requestId = reviewRequestId.trim() ? BigInt(reviewRequestId) : null;
          if (!requestId) {
            throw new Error("Enter a valid request ID.");
          }

          await contract.write.reviewRequest(
            [requestId, reviewApprove, reviewNote.trim()],
            { account, chain: sepolia },
          );
        }}
      >
        <input
          type="text"
          value={reviewRequestId}
          onChange={(event) => setReviewRequestId(event.target.value)}
          placeholder="Request ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={reviewApprove}
            onChange={(event) => setReviewApprove(event.target.checked)}
          />
          Approve request
        </label>
        <textarea
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Lead note"
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </ContractActionForm>
    </div>
  );
}
