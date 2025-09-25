import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const farcasterConnector = connectors.find((c) => c.name === "Farcaster");
  const walletConnectConnector = connectors.find((c) => c.name === "WalletConnect");

  if (isConnected) {
    return (
      <div className="p-2 text-center">
        <p className="text-xs text-slate-400 break-words">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <button
          onClick={() => disconnect()}
          className="mt-2 text-xs w-full text-center text-slate-400 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {farcasterConnector && (
        <button
          key={farcasterConnector.id}
          onClick={() => connect({ connector: farcasterConnector })}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition"
        >
          Connect Farcaster
        </button>
      )}

      {walletConnectConnector && (
        <button
          key={walletConnectConnector.id}
          onClick={() => connect({ connector: walletConnectConnector })}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition"
        >
          Connect WalletConnect
        </button>
      )}

      {!farcasterConnector && !walletConnectConnector && (
        <p className="p-2 text-xs text-yellow-400">No connectors found.</p>
      )}
    </div>
  );
}
