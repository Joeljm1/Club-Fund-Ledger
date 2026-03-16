type NetworkAlertProps = {
  chainId: number;
  isSwitchingChain: boolean;
  onSwitch: () => void;
};

export function NetworkAlert({
  chainId,
  isSwitchingChain,
  onSwitch,
}: NetworkAlertProps) {
  return (
    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          MetaMask is connected to chain {chainId}. Switch to Sepolia before
          sending transactions.
        </span>
        <button
          type="button"
          className="rounded-full bg-amber-500 px-4 py-2 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
          onClick={onSwitch}
          disabled={isSwitchingChain}
        >
          {isSwitchingChain ? "Opening MetaMask..." : "Switch to Sepolia"}
        </button>
      </div>
    </div>
  );
}
