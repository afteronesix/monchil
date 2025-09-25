import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { http, createConfig } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import { monadTestnet } from 'wagmi/chains'

const projectId = 'b5177ed9c756b72ea8a9cb11f7aab606'

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    miniAppConnector(),
    walletConnect({ projectId }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
