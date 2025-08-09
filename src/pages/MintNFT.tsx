import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import abi from "../MonABI.json";
import { toast } from "react-toastify";

const CONTRACT_ADDRESS = "0x5fd581965DAAC580561b31b1a4D57a8636e27a4c";
const PRICE_PER_NFT = 0.2;
const MAX_SUPPLY = 10000;
const MAX_QUANTITY = 2;

export function MintNFT() {
  const [quantity, setQuantity] = useState(1);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: totalMinted, refetch: refetchTotalMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "totalSupply",
    chainId: monadTestnet.id,
  });

  const { data: yourMinted, refetch: refetchYourMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "balanceOf",
    args: [address || "0x0"],
    chainId: monadTestnet.id,
  });

  const hasNFT = Number(yourMinted || 0) >= 1;

  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotalMinted();
      refetchYourMinted();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchTotalMinted, refetchYourMinted]);

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
      toast.success("Switched to Monad Testnet");
    } catch (error) {
      toast.error("Failed to switch chain");
    }
  };

  const handleMint = async () => {
    if (!address) return toast.error("Wallet not connected");
    if (chainId !== monadTestnet.id) return toast.warning("Please switch to Monad Testnet");

    try {
      const value = BigInt(Math.round(PRICE_PER_NFT * quantity * 1e18));
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [BigInt(quantity)],
        value: value,
      });
      toast.success(`🎉 Successfully minted ${quantity} NFT(s)!`);
      refetchTotalMinted();
      refetchYourMinted();
      sdk.actions.composeCast({
        text: `I just minted ${quantity} Monchil NFT(s) ✨`,
        embeds: ["https://monchil.vercel.app"],
      });
    } catch (err) {
      toast.error("Mint Failed.");
      console.error(err);
    }
  };
  
  const handleManualShare = async () => {
    sdk.actions.composeCast({
        text: "I already minted a Monchil NFT, get yours too!",
        embeds: ["https://monchil.vercel.app"],
      });
  }

  return (
    <div className="flex items-center justify-center h-full">
        <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Monchil NFT</h1>
            <p className="text-sm text-gray-500 mb-4">
                A collection of cute characters from the world of Mon.
            </p>

            <img
                src="/logo.png" // Assuming logo.png is in the public folder
                alt="Monchil Preview"
                className="rounded-xl mx-auto border-4 border-pink-200 shadow-md mb-4 w-64 h-64 object-cover"
            />

            {isConnected && chainId !== monadTestnet.id && (
                <button
                    onClick={handleSwitchChain}
                    className="mb-4 bg-yellow-400 text-yellow-900 py-2 px-4 rounded-lg font-bold shadow-md hover:bg-yellow-500 transition-colors"
                >
                    Switch to Monad
                </button>
            )}

            {!hasNFT && isConnected && (
                <div className="flex items-center justify-center mb-6 gap-3">
                    <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="bg-pink-200 text-pink-700 w-10 h-10 rounded-full text-2xl font-bold flex items-center justify-center"
                    >
                        -
                    </button>
                    <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                    <button
                        onClick={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))}
                        className="bg-pink-200 text-pink-700 w-10 h-10 rounded-full text-2xl font-bold flex items-center justify-center"
                    >
                        +
                    </button>
                </div>
            )}

            <div className="mb-2 text-sm text-gray-600">
                Total Minted: <strong>{Number(totalMinted || 0)} / {MAX_SUPPLY}</strong>
            </div>
            {isConnected && (
                 <div className="mb-4 text-sm text-gray-600">
                    You Minted: <strong>{Number(yourMinted || 0)} / 1</strong>
                </div>
            )}

            {isConnected ? (
                <>
                    {!hasNFT ? (
                        <button
                            disabled={isPending}
                            onClick={handleMint}
                            className="w-full bg-purple-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
                        >
                            {isPending ? "Processing..." : `Mint ${quantity} for ${PRICE_PER_NFT * quantity} MON`}
                        </button>
                    ) : (
                        <button
                            onClick={handleManualShare}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transition"
                        >
                            Share My NFT!
                        </button>
                    )}
                </>
            ) : (
                <p className="text-gray-500 mt-4">Connect your wallet to get started.</p>
            )}
        </div>
    </div>
  );
}