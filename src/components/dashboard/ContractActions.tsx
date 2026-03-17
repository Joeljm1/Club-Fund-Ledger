import { useEffect, useState } from "react";
import { sepolia } from "viem/chains";
import { useConnection, useWalletClient } from "wagmi";
import {
  getStudentClubWalletContract,
  studentClubAddressConfigured,
} from "../../contracts/studentClub";
import { errorMessage, parseAmountToPaise } from "../../lib/format";
import { type RequestView } from "../../types/dashboard";

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
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

type AdminContractActionsProps = {
  selectedRequest?: RequestView | null;
};

export function AdminContractActions({
  selectedRequest,
}: AdminContractActionsProps) {
  const [adminAddress, setAdminAddress] = useState("");
  const [adminApproved, setAdminApproved] = useState(true);

  const [clubName, setClubName] = useState("");
  const [clubLead, setClubLead] = useState("");
  const [clubBudget, setClubBudget] = useState("");

  const [budgetClubId, setBudgetClubId] = useState("");
  const [budgetValue, setBudgetValue] = useState("");

  const [leadClubId, setLeadClubId] = useState("");
  const [leadAddress, setLeadAddress] = useState("");

  const [studentClubId, setStudentClubId] = useState("");
  const [studentAddress, setStudentAddress] = useState("");

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

      <ContractActionForm
        title="Set club budget"
        description="Adjust a club budget. Value is entered in rupees."
        submitLabel="Update budget"
        onSubmit={async (contract, account) => {
          const clubId = budgetClubId.trim() ? BigInt(budgetClubId) : null;
          const budgetPaise = parseAmountToPaise(budgetValue);
          if (!clubId) {
            throw new Error("Enter a valid club ID.");
          }
          if (budgetPaise === null || budgetPaise <= 0n) {
            throw new Error("Enter a valid budget in rupees.");
          }

          await contract.write.setClubBudget([clubId, budgetPaise], {
            account,
            chain: sepolia,
          });
        }}
      >
        <input
          type="text"
          value={budgetClubId}
          onChange={(event) => setBudgetClubId(event.target.value)}
          placeholder="Club ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="text"
          value={budgetValue}
          onChange={(event) => setBudgetValue(event.target.value)}
          placeholder="New budget in rupees"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </ContractActionForm>

      <ContractActionForm
        title="Set club lead"
        description="Assign a new lead wallet for a club."
        submitLabel="Update lead"
        onSubmit={async (contract, account) => {
          const clubId = leadClubId.trim() ? BigInt(leadClubId) : null;
          if (!clubId) {
            throw new Error("Enter a valid club ID.");
          }
          if (!isAddress(leadAddress)) {
            throw new Error("Enter a valid lead wallet address.");
          }

          await contract.write.setClubLead(
            [clubId, leadAddress.trim() as `0x${string}`],
            { account, chain: sepolia },
          );
        }}
      >
        <input
          type="text"
          value={leadClubId}
          onChange={(event) => setLeadClubId(event.target.value)}
          placeholder="Club ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="text"
          value={leadAddress}
          onChange={(event) => setLeadAddress(event.target.value)}
          placeholder="New lead wallet address"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </ContractActionForm>

      <ContractActionForm
        title="Add student to club"
        description="Register a student wallet under a club."
        submitLabel="Add student"
        onSubmit={async (contract, account) => {
          const clubId = studentClubId.trim() ? BigInt(studentClubId) : null;
          if (!clubId) {
            throw new Error("Enter a valid club ID.");
          }
          if (!isAddress(studentAddress)) {
            throw new Error("Enter a valid student wallet address.");
          }

          await contract.write.addStudentToClub(
            [clubId, studentAddress.trim() as `0x${string}`],
            { account, chain: sepolia },
          );
        }}
      >
        <input
          type="text"
          value={studentClubId}
          onChange={(event) => setStudentClubId(event.target.value)}
          placeholder="Club ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="text"
          value={studentAddress}
          onChange={(event) => setStudentAddress(event.target.value)}
          placeholder="Student wallet address"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </ContractActionForm>

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
