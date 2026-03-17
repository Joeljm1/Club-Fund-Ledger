import { useState } from "react";
import { useConnection } from "wagmi";
import { ClubTransactionsExplorer } from "../components/dashboard/ClubTransactionsExplorer";
import { LeadContractActions } from "../components/dashboard/ContractActions";
import { useAllRequests, useUserRoles } from "../hooks/useStudentClubReads";
import { type ClubView, type RequestView } from "../types/dashboard";

export function LeadActionsPage() {
  const { address, isConnected } = useConnection();
  const { isLead, leadClubs, isLoadingRoles } = useUserRoles(address);
  const { requests, isLoadingRequests } = useAllRequests();
  const [selectedRequest, setSelectedRequest] = useState<RequestView | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubView | null>(null);
  const leadClubIds = new Set(leadClubs.map((club) => club.id.toString()));
  const leadRequests = requests.filter((request) => leadClubIds.has(request.clubId.toString()));

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
          Lead
        </div>
        <h2 className="mt-3 text-3xl font-bold text-slate-950">Lead actions</h2>
        <p className="mt-2 text-sm text-slate-500">
          Review submitted expense requests for your clubs.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Connect MetaMask to access lead actions.
        </div>
      ) : isLoadingRoles ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Checking lead access...
        </div>
      ) : !isLead ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          The connected wallet is not the lead of any active club.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Lead for: {leadClubs.map((club) => `${club.name} (#${club.id})`).join(", ")}
          </div>
          <ClubTransactionsExplorer
            clubs={leadClubs}
            requests={leadRequests}
            isLoading={isLoadingRequests}
            title="Your clubs"
            description="Open a club to see all transactions, receipts, notes, and requests awaiting review."
            emptyMessage="No clubs are currently assigned to this lead."
            selectedClub={selectedClub}
            onSelectClub={setSelectedClub}
            onCloseClub={() => setSelectedClub(null)}
            actionLabel="Review"
            actionableStatuses={[0n]}
            onSelectRequest={setSelectedRequest}
          />
          <LeadContractActions
            selectedRequest={selectedRequest}
            onClose={() => setSelectedRequest(null)}
          />
        </>
      )}
    </section>
  );
}
