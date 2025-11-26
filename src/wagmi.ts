import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

const monad = defineChain({
  id: 143,
  caipNetworkId: "eip155:143",
  chainNamespace: "eip155",
  name: "Monad",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: { http: ["https://rpc3.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadScan", url: "https://monadscan.com/" },
  },
});

const projectId = "b5177ed9c756b72ea8a9cb11f7aab606";

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [monad],
  ssr: true,
  connectors: [miniAppConnector()],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [monad],
  projectId,
  metadata: {
    name: "Monchil",
    description: "Monchil dApp on Monad",
    url: "https://monchil.vercel.app",
    icons: ["https://monchil.vercel.app/monad.png"],
  },
  chainImages: {
    [monad.id]: "/monad.png",
  },
  features: {
    socials: ["farcaster"],
    swaps: false,
    onramp: false,
    history: false,
    send: true,
  },
  themeMode: "dark",
});

export const config = wagmiAdapter.wagmiConfig;
