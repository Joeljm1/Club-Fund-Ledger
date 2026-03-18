import { useQueries } from "@tanstack/react-query";
import { formatPaise, requestStatusLabel } from "../../lib/format";
import { fetchReceipt } from "../../lib/receipt";
import { type RequestView } from "../../types/dashboard";

type RequestsSectionProps = {
  isLoading: boolean;
  requests: RequestView[];
};

export function RequestsSection({
  isLoading,
  requests,
}: RequestsSectionProps) {
  const receiptQueries = useQueries({
    queries: requests.map((request) => ({
      queryKey: ["receipt", request.receiptId],
      queryFn: () => fetchReceipt(request.receiptId),
      enabled: /^\d+$/.test(request.receiptId),
    })),
  });

  const receiptMap = new Map(
    requests.map((request, index) => [request.receiptId, receiptQueries[index]?.data]),
  );

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-950">Your requests</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted expenses, their current status, and any attached
            receipt details.
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

                {receiptMap.get(request.receiptId) ? (
                  <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    {receiptMap.get(request.receiptId)?.mime_type.startsWith("image/") ? (
                      <img
                        src={receiptMap.get(request.receiptId)?.url}
                        alt={`Receipt ${request.receiptId}`}
                        className="h-64 w-full object-cover"
                      />
                    ) : (
                      <div className="px-4 py-6 text-sm text-slate-600">
                        Receipt file preview is not available for this file type.
                      </div>
                    )}
                    <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                      <div className="font-medium text-slate-950">
                        {receiptMap.get(request.receiptId)?.original_name}
                      </div>
                      <a
                        href={receiptMap.get(request.receiptId)?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-orange-700 underline"
                      >
                        Open receipt file
                      </a>
                    </div>
                  </div>
                ) : receiptQueries.find(
                    (query, index) =>
                      requests[index]?.receiptId === request.receiptId && query.isError,
                  ) ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Receipt file could not be loaded from the backend.
                  </div>
                ) : null}

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
