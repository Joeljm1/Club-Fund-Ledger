import { shortAddress } from "../../lib/format";

type SessionCardProps = {
  address?: string;
  isConnected: boolean;
  networkLabel: string;
  txState: string;
  hash?: `0x${string}`;
};

export function SessionCard({
  address,
  isConnected,
  networkLabel,
  txState,
  hash,
}: SessionCardProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
      <div className="text-sm text-slate-300">Session</div>
      <dl className="mt-4 space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">Wallet</dt>
          <dd className="font-semibold">{shortAddress(address)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">Status</dt>
          <dd className="font-semibold">
            {isConnected ? "Connected" : "Disconnected"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">Network</dt>
          <dd className="font-semibold">{networkLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-slate-400">Tx State</dt>
          <dd className="font-semibold">{txState}</dd>
        </div>
      </dl>

      {hash ? (
        <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
          Latest tx: {shortAddress(hash)}
        </div>
      ) : null}
    </div>
  );
}
