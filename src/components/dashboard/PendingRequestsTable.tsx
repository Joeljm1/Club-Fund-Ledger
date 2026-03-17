import { useQueries } from "@tanstack/react-query";
import { formatPaise, requestStatusLabel, shortAddress } from "../../lib/format";
import { fetchReceipt } from "../../lib/receipt";
import { type RequestView } from "../../types/dashboard";

type PendingRequestsTableProps = {
  requests: RequestView[];
  isLoading: boolean;
  title: string;
  description: string;
  emptyMessage: string;
  actionLabel: string;
  onSelect: (request: RequestView) => void;
};

export function PendingRequestsTable({
  requests,
  isLoading,
  title,
  description,
  emptyMessage,
  actionLabel,
  onSelect,
}: PendingRequestsTableProps) {
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
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="text-sm text-slate-400">
          {isLoading ? "Loading..." : `${requests.length} requests`}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-3 font-medium">Request</th>
                <th className="px-3 py-3 font-medium">Club</th>
                <th className="px-3 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Receipt</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => {
                const receipt = receiptMap.get(request.receiptId);
                const receiptQuery = receiptQueries.find(
                  (_query, index) => requests[index]?.receiptId === request.receiptId,
                );

                return (
                  <tr key={request.id.toString()} className="align-top">
                    <td className="px-3 py-4">
                      <div className="font-semibold text-slate-950">
                        #{request.id.toString()}
                      </div>
                      <div className="mt-1 text-slate-600">{request.purpose}</div>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      #{request.clubId.toString()}
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      {shortAddress(request.student)}
                    </td>
                    <td className="px-3 py-4 font-medium text-slate-950">
                      {formatPaise(request.amountPaise)}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {requestStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {receipt ? (
                        <div className="space-y-2">
                          {receipt.mime_type.startsWith("image/") ? (
                            <img
                              src={receipt.url}
                              alt={`Receipt ${request.receiptId}`}
                              className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                            />
                          ) : receipt.mime_type === "application/pdf" ? (
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                              PDF receipt
                            </div>
                          ) : (
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                              File attached
                            </div>
                          )}
                          <div className="max-w-32 break-words text-xs text-slate-500">
                            {receipt.original_name}
                          </div>
                          <a
                            href={receipt.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex text-orange-700 underline"
                          >
                            Open
                          </a>
                        </div>
                      ) : receiptQuery?.isLoading ? (
                        <div className="text-slate-500">Loading...</div>
                      ) : receiptQuery?.isError ? (
                        <div className="text-amber-700">Failed to load</div>
                      ) : (
                        <div className="text-slate-500">Unavailable</div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => onSelect(request)}
                        className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white"
                      >
                        {actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
