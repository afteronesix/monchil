import { useState, useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import abi from "./MonABI.json";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CONTRACT_ADDRESS = "0x5fd581965DAAC580561b31b1a4D57a8636e27a4c";
const PRICE_PER_NFT = 0.2;
const MAX_SUPPLY = 10000;
const MAX_QUANTITY = 2; // Added constant for max quantity

export default function App() {
  const [quantity, setQuantity] = useState(1);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const totalMintedResult = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "totalSupply",
    chainId: monadTestnet.id,
  });

  const yourMintedResult = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: monadTestnet.id,
  });

  const hasNFT = Number(yourMintedResult.data || 0) >= 1;

  const { writeContractAsync, isPending } = useWriteContract();

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      totalMintedResult.refetch?.();
      yourMintedResult.refetch?.();
    }, 10000);
    return () => clearInterval(interval);
  }, [totalMintedResult.refetch, yourMintedResult.refetch]);

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
      toast.success("Switched to Monad Testnet");
    } catch (error) {
      toast.error("Failed to switch chain");
      console.error(error);
    }
  };

  const handleMint = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (chainId !== monadTestnet.id) {
      toast.warning("Please switch to Monad Testnet");
      return;
    }

    try {
      const value = BigInt(PRICE_PER_NFT * quantity * 1e18);

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [quantity],
        value: value,
        chainId: monadTestnet.id,
      });

      toast.success(`🎉 Successfully minted ${quantity} NFT${quantity > 1 ? "s" : ""}!`);

      totalMintedResult.refetch?.();
      yourMintedResult.refetch?.();

      try {
        await sdk.actions.composeCast({
          text: `I just minted ${quantity} Monchil NFT${quantity > 1 ? "s" : ""} ✨`,
          embeds: ["https://monchil.vercel.app", "https://farcaster.xyz/owr/0x661201f4"],
        });
      } catch (castErr) {
        console.error("Farcaster cast failed:", castErr);
        toast.warning("Minted successfully, but failed to post to Farcaster.");
      }
    } catch (err) {
      console.error("Mint failed:", err);
      toast.error("Mint Failed.");
    }
  };

  const handleManualShare = async () => {
    try {
      await sdk.actions.composeCast({
        text: "I already minted 1 Monchil NFT, get yours too!",
        embeds: ["https://monchil.vercel.app", "https://farcaster.xyz/owr/0x169e0640"],
      });
      toast.success("Shared to Farcaster!");
    } catch (err) {
      console.error("Manual cast failed:", err);
      toast.error("Failed to share on Farcaster.");
    }
  };

  return (
    <div className="min-h-screen bg-purple-400 flex items-center justify-center p-4">
      <ToastContainer />
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-purple-600 mb-2">Monchil NFT</h1>
        <p className="text-sm text-gray-500 mb-4">
          Monchil NFT is a collection of cute characters from the world of Mon.
        </p>

        <img
          src="https://monchil.vercel.app/logo.png"
          alt="Monchil Preview"
          className="rounded-xl mx-auto border-4 border-pink-200 shadow-md mb-4"
        />

        {isConnected && chainId !== monadTestnet.id && (
          <div className="mb-4">
            <button
              onClick={handleSwitchChain}
              className="bg-white text-purple-800 py-2 px-4 rounded-3xl font-bold shadow-md hover:bg-purple-100 transition-colors"
            >
              Switch to Monad
            </button>
          </div>
        )}

        {!hasNFT && (
          <div className="flex items-center justify-center mb-6 gap-2">
            <button
              onClick={() => quantity > 1 && setQuantity(quantity - 1)}
              className="bg-pink-200 text-pink-700 px-3 py-1 rounded-full text-xl"
            >
              -
            </button>
            <span className="text-xl font-bold w-10 text-center">{quantity}</span>
            {quantity < MAX_QUANTITY && (
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="bg-pink-200 text-pink-700 px-3 py-1 rounded-full text-xl"
              >
                +
              </button>
            )}
          </div>
        )}

        <div className="mb-2 text-sm text-gray-600">
          🧮 Total Minted:{" "}
          <strong>{Number(totalMintedResult.data || 0)} / {MAX_SUPPLY}</strong>
        </div>
        <div className="mb-4 text-sm text-gray-600">
          👤 You Minted:{" "}
          <strong>{Number(yourMintedResult.data || 0)} / 1</strong>
        </div>

        {isConnected ? (
          <>
            {!hasNFT ? (
              <button
                disabled={isPending}
                onClick={handleMint}
                className="w-full bg-purple-500 hover:bg-pink-600 text-white font-bold py-2 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isPending
                  ? "Processing..."
                  : `🎉 Mint ${quantity} NFT${quantity > 1 ? "s" : ""} (${PRICE_PER_NFT * quantity} MON)`}
              </button>
            ) : (
              <button
                onClick={handleManualShare}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition"
              >
                📢 Share my NFT 🎉
              </button>
            )}

            <button
              onClick={() => disconnect()}
              className="mt-2 text-sm text-purple-500 underline"
            >
              Disconnect Wallet
            </button>
          </>
        ) : (
          <div className="space-y-2">
            {connectors
              .filter((c) => c.name === "Farcaster")
              .map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="w-full bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 rounded-xl shadow-md transition"
                >
                  🔐 Connect with {connector.name}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
