import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { http, createConfig } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'



export const config = createConfig({
  chains: [monadTestnet],
  connectors: [miniAppConnector()],
  transports: {
    [monadTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}