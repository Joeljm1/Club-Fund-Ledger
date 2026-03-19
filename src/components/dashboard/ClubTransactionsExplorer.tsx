import { useQueries } from "@tanstack/react-query";
import { fetchReceipt } from "../../lib/receipt";
import {
  formatPaise,
  requestStatusLabel,
  shortAddress,
} from "../../lib/format";
import { type ClubView, type RequestView } from "../../types/dashboard";

type ClubTransactionsExplorerProps = {
  clubs: ClubView[];
  requests: RequestView[];
  isLoading: boolean;
  title: string;
  description: string;
  emptyMessage: string;
  selectedClub: ClubView | null;
  onSelectClub: (club: ClubView) => void;
  onCloseClub: () => void;
  actionLabel?: string;
  actionableStatuses?: bigint[];
  onSelectRequest?: (request: RequestView) => void;
};

export function ClubTransactionsExplorer({
  clubs,
  requests,
  isLoading,
  title,
  description,
  emptyMessage,
  selectedClub,
  onSelectClub,
  onCloseClub,
  actionLabel,
  actionableStatuses,
  onSelectRequest,
}: ClubTransactionsExplorerProps) {
  return (
    <>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
          </div>
          <div className="text-sm text-slate-400">
            {isLoading ? "Loading..." : `${clubs.length} clubs`}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {clubs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            clubs.map((club) => {
              const clubRequests = requests.filter(
                (request) => request.clubId === club.id,
              );
              const submittedCount = clubRequests.length;
              const approvedCount = clubRequests.filter(
                (request) => request.status === 1n || request.status === 3n,
              ).length;

              return (
                <button
                  key={club.id.toString()}
                  type="button"
                  onClick={() => onSelectClub(club)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                        Club #{club.id.toString()}
                      </div>
                      <h4 className="mt-2 text-lg font-bold text-slate-950">{club.name}</h4>
                      <div className="mt-2 text-sm text-slate-500">
                        Lead {shortAddress(club.lead)}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {clubRequests.length} transactions
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white px-3 py-2 font-medium text-slate-700">
                      Budget {formatPaise(club.budgetPaise)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2 font-medium text-slate-700">
                      Reserved {formatPaise(club.reservedPaise)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2 font-medium text-slate-700">
                      Used {formatPaise(club.spentPaise)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2 font-medium text-slate-700">
                      Submitted {submittedCount}
                    </span>
                    <span className="rounded-full bg-white px-3 py-2 font-medium text-slate-700">
                      Approved {approvedCount}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedClub ? (
        <ClubTransactionsLayer
          club={selectedClub}
          requests={requests.filter((request) => request.clubId === selectedClub.id)}
          actionLabel={actionLabel}
          actionableStatuses={actionableStatuses}
          onClose={onCloseClub}
          onSelectRequest={onSelectRequest}
        />
      ) : null}
    </>
  );
}

type ClubTransactionsLayerProps = {
  club: ClubView;
  requests: RequestView[];
  actionLabel?: string;
  actionableStatuses?: bigint[];
  onClose: () => void;
  onSelectRequest?: (request: RequestView) => void;
};

function ClubTransactionsLayer({
  club,
  requests,
  actionLabel,
  actionableStatuses,
  onClose,
  onSelectRequest,
}: ClubTransactionsLayerProps) {
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
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
              Club Transactions
            </div>
            <h3 className="mt-3 text-3xl font-bold text-slate-950">{club.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Club #{club.id.toString()} • Lead {shortAddress(club.lead)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Budget</div>
            <div className="mt-2 font-semibold text-slate-950">
              {formatPaise(club.budgetPaise)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">Reserved</div>
            <div className="mt-2 font-semibold text-slate-950">
              {formatPaise(club.reservedPaise)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
              Money Used
            </div>
            <div className="mt-2 font-semibold text-slate-950">
              {formatPaise(club.spentPaise)}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              No transactions found for this club.
            </div>
          ) : (
            requests
              .slice()
              .reverse()
              .map((request) => {
                const receipt = receiptMap.get(request.receiptId);
                const canAct =
                  Boolean(actionLabel && onSelectRequest) &&
                  (actionableStatuses?.includes(request.status) ?? true);

                return (
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
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                          <span>{shortAddress(request.student)}</span>
                          <span>{formatPaise(request.amountPaise)}</span>
                          <span>Used {formatPaise(request.status === 3n ? request.amountPaise : 0n)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {requestStatusLabel(request.status)}
                        </div>
                        {canAct ? (
                          <button
                            type="button"
                            onClick={() => onSelectRequest?.(request)}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                          >
                            {actionLabel}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {receipt ? (
                      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        {receipt.mime_type.startsWith("image/") ? (
                          <img
                            src={receipt.url}
                            alt={`Receipt ${request.receiptId}`}
                            className="max-h-80 w-full object-contain bg-slate-100"
                          />
                        ) : receipt.mime_type === "application/pdf" ? (
                          <iframe
                            src={receipt.url}
                            title={`Receipt ${request.receiptId}`}
                            className="h-80 w-full bg-white"
                          />
                        ) : (
                          <div className="px-4 py-6 text-sm text-slate-600">
                            Preview is not available for this file type. Open the receipt file
                            directly.
                          </div>
                        )}
                        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                          <div className="font-medium text-slate-950">{receipt.original_name}</div>
                          <a
                            href={receipt.url}
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
                    ) : (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        Loading receipt...
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
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

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {request.leadNote ? (
                        <div className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                          <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            Lead note
                          </div>
                          <div className="mt-2">{request.leadNote}</div>
                        </div>
                      ) : null}

                      {request.payoutReference ? (
                        <div className="rounded-2xl bg-white p-3 text-sm text-slate-700">
                          <div className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            Payout reference
                          </div>
                          <div className="mt-2">{request.payoutReference}</div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
