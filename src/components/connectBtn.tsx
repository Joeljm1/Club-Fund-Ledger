import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const metaMaskConnector = connectors.find(
    (connector) => connector.name === "MetaMask",
  );

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm sm:block">
          {address}
        </div>
        <button
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          onClick={() => disconnect()}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        onClick={() => {
          if (metaMaskConnector) {
            connect({ connector: metaMaskConnector });
          }
        }}
        disabled={!metaMaskConnector || isPending}
      >
        {isPending ? "Connecting..." : "Connect MetaMask"}
      </button>
    </div>
  );
}

export default ConnectButton;
