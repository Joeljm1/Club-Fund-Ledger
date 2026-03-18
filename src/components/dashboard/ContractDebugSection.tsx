import { studentClubAddress } from "../../contracts/studentClub";

type ContractDebugSectionProps = {
  address?: string;
  chainId?: number;
  isAdmin: boolean | undefined;
};

export function ContractDebugSection({
  address,
  chainId,
  isAdmin,
}: ContractDebugSectionProps) {
  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-bold text-slate-950">Connection details</h3>
      <p className="mt-1 text-sm text-slate-500">
        Verify the wallet, network, and deployment before submitting or
        approving requests.
      </p>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Connected wallet</dt>
          <dd className="mt-2 break-all text-sm font-semibold text-slate-950">
            {address ?? "Not connected"}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Contract address</dt>
          <dd className="mt-2 break-all text-sm font-semibold text-slate-950">
            {studentClubAddress}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Chain ID</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">
            {chainId ?? "Not connected"}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Access level</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">
            {address ? (isAdmin ? "Admin" : "Standard user") : "No wallet connected"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
