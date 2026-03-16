import { studentClubAddress, studentClubAddressConfigured } from "../../contracts/studentClub";
import { shortAddress } from "../../lib/format";

type HeroSectionProps = {
  clubsCount: number;
  isAdmin: boolean | undefined;
  isRegisteredStudent: boolean;
  activeClubId: bigint;
};

export function HeroSection({
  clubsCount,
  isAdmin,
  isRegisteredStudent,
  activeClubId,
}: HeroSectionProps) {
  return (
    <div className="rounded-[2rem] border border-orange-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
        Restored Contract Integration
      </span>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
        The frontend is reading club data and writing expense requests onchain
        again.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        This dashboard pulls club records, student membership, and request
        history from the deployed contract, then submits new expense requests
        through MetaMask.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Contract</div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            {studentClubAddressConfigured
              ? shortAddress(studentClubAddress)
              : "Missing env"}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Clubs</div>
          <div className="mt-2 text-2xl font-black text-slate-950">
            {clubsCount}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Your Role</div>
          <div className="mt-2 text-sm font-semibold text-slate-950">
            {isAdmin
              ? "Admin"
              : isRegisteredStudent
                ? `Student in Club #${activeClubId}`
                : "Viewer"}
          </div>
        </div>
      </div>
    </div>
  );
}
