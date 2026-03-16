import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const infuraAPIKey = import.meta.env.VITE_INFURA_API_KEY as string | undefined;

export const config = createConfig({
  ssr: false, // Enable this if your dapp uses server-side rendering.
  chains: [mainnet, sepolia],
  connectors: [
    metaMask(
      infuraAPIKey
        ? {
            infuraAPIKey,
          }
        : {},
    ),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
