import { useState } from "react";
import { useConnection } from "wagmi";
import { ClubTransactionsExplorer } from "../components/dashboard/ClubTransactionsExplorer";
import { AdminContractActions } from "../components/dashboard/ContractActions";
import { useAllRequests, useClubs, useUserRoles } from "../hooks/useStudentClubReads";
import { type ClubView, type RequestView } from "../types/dashboard";

export function AdminActionsPage() {
  const { address, isConnected } = useConnection();
  const { isAdmin, isLoadingRoles } = useUserRoles(address);
  const { clubs, isLoadingClubs } = useClubs();
  const { requests, isLoadingRequests } = useAllRequests();
  const [selectedRequest, setSelectedRequest] = useState<RequestView | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubView | null>(null);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
          Admin
        </div>
        <h2 className="mt-3 text-3xl font-bold text-slate-950">Admin actions</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage admins, clubs, students, budgets, leads, and disbursements.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Connect MetaMask to access admin actions.
        </div>
      ) : isLoadingRoles ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Checking admin access...
        </div>
      ) : !isAdmin ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          The connected wallet is not an admin for this contract.
        </div>
      ) : (
        <>
          <ClubTransactionsExplorer
            clubs={clubs}
            requests={requests}
            isLoading={isLoadingClubs || isLoadingRequests}
            title="All clubs"
            description="Open any club to see its transactions, receipts, reviews, and approved requests awaiting disbursal."
            emptyMessage="No clubs are available in the contract."
            selectedClub={selectedClub}
            onSelectClub={setSelectedClub}
            onCloseClub={() => setSelectedClub(null)}
            actionLabel="Disburse"
            actionableStatuses={[1n]}
            onSelectRequest={setSelectedRequest}
          />
          <AdminContractActions
            selectedRequest={selectedRequest}
            onCloseSelectedRequest={() => setSelectedRequest(null)}
          />
        </>
      )}
    </section>
  );
}
