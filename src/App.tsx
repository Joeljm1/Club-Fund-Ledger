import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { config } from "./config";
import { ConnectButton } from "./components/connectBtn";

const client = new QueryClient();

function shortAddress(address?: string) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const networkLabel =
    chainId === sepolia.id ? "Sepolia" : isConnected ? `Chain ${chainId}` : "Offline";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_36%,_#f8fafc_100%)]">
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

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-orange-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              MetaMask + Sepolia
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Track club budgets, student requests, and approvals in one place.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Use the navbar for wallet connection and session details. The main
              dashboard can now be extended with club, admin, and receipt
              management sections without scattering wallet controls around the
              page.
            </p>
          </div>

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
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <Dashboard />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
