import { useConnection } from "wagmi";
import { LeadContractActions } from "../components/dashboard/ContractActions";
import { useUserRoles } from "../hooks/useStudentClubReads";

export function LeadActionsPage() {
  const { address, isConnected } = useConnection();
  const { isLead, leadClubs, isLoadingRoles } = useUserRoles(address);

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
          <LeadContractActions />
        </>
      )}
    </section>
  );
}
