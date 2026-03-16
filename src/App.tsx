import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./config";
import { RequestDataDisplay, RequestDataUpdater } from "./req";

const client = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <main className="min-h-screen bg-slate-100 px-6 py-12">
          <div className="mx-auto flex max-w-xl flex-col gap-6">
            <h1 className="text-2xl font-bold text-slate-900">Request Demo</h1>
            <RequestDataDisplay />
            <RequestDataUpdater />
          </div>
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
