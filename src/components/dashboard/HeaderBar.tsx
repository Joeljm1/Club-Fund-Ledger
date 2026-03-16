import { ConnectButton } from "../connectBtn";
import { shortAddress } from "../../lib/format";

type HeaderBarProps = {
  address?: string;
  networkLabel: string;
};

export function HeaderBar({ address, networkLabel }: HeaderBarProps) {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
            Student Club
          </div>
          <h1 className="text-lg font-bold text-slate-950 sm:text-xl">
            Fund Tracking System
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-sm text-slate-700 md:flex">
            <span className="font-semibold text-slate-900">{networkLabel}</span>
            <span className="text-slate-400">|</span>
            <span>{shortAddress(address)}</span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
