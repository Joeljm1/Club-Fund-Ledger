import { type FormEvent } from "react";
import { sepolia } from "wagmi/chains";
import { formatPaise } from "../../lib/format";
import { studentClubAddressConfigured } from "../../contracts/studentClub";
import { type ClubView } from "../../types/dashboard";

type SubmitExpenseSectionProps = {
  activeClubId: bigint;
  amountInput: string;
  chainId?: number;
  clubIdInput: string;
  isConnected: boolean;
  isConfirmed: boolean;
  isConfirming: boolean;
  isPending: boolean;
  purposeInput: string;
  receiptHash?: string | null;
  receiptId?: string | null;
  receiptName: string;
  selectedClub?: ClubView;
  submitError: string | null;
  onAmountChange: (value: string) => void;
  onClubIdChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onReceiptFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SubmitExpenseSection({
  activeClubId,
  amountInput,
  chainId,
  clubIdInput,
  isConnected,
  isConfirmed,
  isConfirming,
  isPending,
  purposeInput,
  receiptHash,
  receiptId,
  receiptName,
  selectedClub,
  submitError,
  onAmountChange,
  onClubIdChange,
  onPurposeChange,
  onReceiptFileChange,
  onSubmit,
}: SubmitExpenseSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <div>
        <h3 className="text-xl font-bold text-slate-950">
          Submit expense request
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Calls `submitExpenseRequest`. The connected wallet must already be
          registered in the selected club.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Club ID
          </span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-orange-500"
            inputMode="numeric"
            placeholder={activeClubId > 0n ? activeClubId.toString() : "1"}
            value={clubIdInput}
            onChange={(event) => onClubIdChange(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Amount (INR)
          </span>
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-orange-500"
            inputMode="decimal"
            placeholder="450.00"
            value={amountInput}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Purpose
          </span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-orange-500"
            placeholder="Event poster printing"
            value={purposeInput}
            onChange={(event) => onPurposeChange(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Receipt / proof file
          </span>
          <input
            type="file"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-orange-500"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(event) =>
              onReceiptFileChange(event.target.files?.[0] ?? null)
            }
          />
          <div className="mt-2 text-xs text-slate-500">
            {receiptName || "No file selected"}
          </div>
        </label>

        {receiptId || receiptHash ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <div>Receipt ID: {receiptId ?? "Pending upload"}</div>
            <div className="mt-1 break-all">Receipt hash: {receiptHash ?? "Pending hash"}</div>
          </div>
        ) : null}

        {selectedClub ? (
          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
            Selected club: {selectedClub.name} with{" "}
            {formatPaise(selectedClub.budgetPaise)} total budget.
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {isConfirmed ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Expense request submitted and confirmed onchain.
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={
            !studentClubAddressConfigured ||
            !isConnected ||
            chainId !== sepolia.id ||
            isPending ||
            isConfirming
          }
        >
          {isPending
            ? "Open MetaMask..."
            : isConfirming
              ? "Confirming..."
              : "Submit Request"}
        </button>
      </form>
    </section>
  );
}
