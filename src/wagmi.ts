import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";

const monad = defineChain({
  id: 10143,
  caipNetworkId: "eip155:10143",
  chainNamespace: "eip155",
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadScan", url: "https://explorer.monad.xyz" },
  },
});

const projectId = "b5177ed9c756b72ea8a9cb11f7aab606";

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [monad],
  ssr: true,
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
    email: false,
    socials: ["farcaster"],
  },
  themeMode: "dark",
});

export const config = wagmiAdapter.wagmiConfig;
