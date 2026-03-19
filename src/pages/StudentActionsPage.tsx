import { useConnection } from "wagmi";
import { SubmitExpenseCard } from "../components/dashboard/SubmitExpenseCard";
import { useUserRoles } from "../hooks/useStudentClubReads";

export function StudentActionsPage() {
  const { address, isConnected } = useConnection();
  const { isRegisteredStudent, activeClubId, isLoadingRoles } =
    useUserRoles(address);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
          Student
        </div>
        <h2 className="mt-3 text-3xl font-bold text-slate-950">
          Student actions
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Submit expense requests for your assigned club.
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Connect MetaMask to access student actions.
        </div>
      ) : isLoadingRoles ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Checking student profile...
        </div>
      ) : !isRegisteredStudent ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          The connected wallet is not registered to any club.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Active club ID: {activeClubId.toString()}
          </div>
          <SubmitExpenseCard />
        </>
      )}
    </section>
  );
}
