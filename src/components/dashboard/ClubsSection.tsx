import { formatPaise, shortAddress } from "../../lib/format";
import { type ClubView } from "../../types/dashboard";

type ClubsSectionProps = {
  clubs: ClubView[];
  isLoading: boolean;
};

export function ClubsSection({ clubs, isLoading }: ClubsSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">Club budgets</h3>
          <p className="mt-1 text-sm text-slate-500">
            See each club's lead, available budget, reserved funds, and spend so
            far.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {isLoading ? "Loading..." : `${clubs.length} loaded`}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {clubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
            No clubs found in the contract.
          </div>
        ) : (
          clubs.map((club) => (
            <article
              key={club.id.toString()}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                    Club #{club.id.toString()}
                  </div>
                  <h4 className="mt-2 text-lg font-bold text-slate-950">
                    {club.name}
                  </h4>
                  <div className="mt-2 text-sm text-slate-500">
                    Lead {shortAddress(club.lead)}
                  </div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {club.active ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                    Budget
                  </div>
                  <div className="mt-2 font-semibold text-slate-950">
                    {formatPaise(club.budgetPaise)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                    Reserved
                  </div>
                  <div className="mt-2 font-semibold text-slate-950">
                    {formatPaise(club.reservedPaise)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                    Money Used
                  </div>
                  <div className="mt-2 font-semibold text-slate-950">
                    {formatPaise(club.spentPaise)}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
