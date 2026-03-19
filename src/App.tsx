import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WagmiProvider, useChainId, useConnection, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { HeaderBar } from "./components/dashboard/HeaderBar";
import { NetworkAlert } from "./components/dashboard/NetworkAlert";
import { config } from "./config";
import { errorMessage } from "./lib/format";
import { AddClubPage } from "./pages/AddClubPage";
import { AdminActionsPage } from "./pages/AdminActionsPage";
import { ContractDebugPage } from "./pages/ContractDebugPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadActionsPage } from "./pages/LeadActionsPage";
import { StudentActionsPage } from "./pages/StudentActionsPage";

const client = new QueryClient();

function AppShell() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const {
    mutateAsync: switchChain,
    error: switchChainError,
    isPending: isSwitchingChain,
  } = useSwitchChain();
  const networkLabel =
    chainId === sepolia.id
      ? "Sepolia"
      : isConnected
        ? `Chain ${chainId}`
        : "Offline";

  async function handleSwitchToSepolia() {
    try {
      await switchChain({ chainId: sepolia.id });
    } catch {
      // The mutation error state is rendered in the alert.
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_36%,_#f8fafc_100%)]">
      <HeaderBar address={address} networkLabel={networkLabel} />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {isConnected && chainId !== sepolia.id ? (
          <NetworkAlert
            chainId={chainId}
            isSwitchingChain={isSwitchingChain}
            onSwitch={() => void handleSwitchToSepolia()}
            error={errorMessage(switchChainError)}
          />
        ) : null}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clubs/new" element={<AddClubPage />} />
          <Route path="/admin" element={<AdminActionsPage />} />
          <Route path="/lead" element={<LeadActionsPage />} />
          <Route path="/student" element={<StudentActionsPage />} />
          <Route path="/contract" element={<ContractDebugPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>
    </main>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
