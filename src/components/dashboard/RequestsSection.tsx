import { formatPaise, requestStatusLabel } from "../../lib/format";
import { type RequestView } from "../../types/dashboard";

type RequestsSectionProps = {
  isLoading: boolean;
  requests: RequestView[];
};

export function RequestsSection({
  isLoading,
  requests,
}: RequestsSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">Your requests</h3>
          <p className="mt-1 text-sm text-slate-500">
            Request history loaded from `getStudentRequestIds` and `getRequest`.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {isLoading ? "Loading..." : `${requests.length} requests`}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
            No requests found for the connected wallet.
          </div>
        ) : (
          requests
            .slice()
            .reverse()
            .map((request) => (
              <article
                key={request.id.toString()}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                      Request #{request.id.toString()}
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-slate-950">
                      {request.purpose}
                    </h4>
                    <div className="mt-2 text-sm text-slate-500">
                      Club #{request.clubId.toString()} •{" "}
                      {formatPaise(request.amountPaise)}
                    </div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {requestStatusLabel(request.status)}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                      Receipt ID
                    </div>
                    <div className="mt-2 font-medium text-slate-950">
                      {request.receiptId}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                    <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                      Receipt Hash
                    </div>
                    <div className="mt-2 break-all font-medium text-slate-950">
                      {request.receiptHash}
                    </div>
                  </div>
                </div>

                {request.leadNote ? (
                  <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-700">
                    Lead note: {request.leadNote}
                  </div>
                ) : null}

                {request.payoutReference ? (
                  <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-700">
                    Payout reference: {request.payoutReference}
                  </div>
                ) : null}
              </article>
            ))
        )}
      </div>
    </section>
  );
}
