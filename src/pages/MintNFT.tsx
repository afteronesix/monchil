import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { upgradeAbi } from "../hooks/abi/AbiUpgrade";
import { monchilIdAbi } from "../hooks/abi/AbiMonchilID";
import { toast } from "react-toastify";

const UPGRADE_CONTRACT: `0x${string}` = "0xfb7EA1fdb323b7e9c97fe6688EeF9A70E910571b";
const NEW_NFT_CONTRACT: `0x${string}` = "0x5f052CC161d117154CA4FED968EA037bF9cE4F02";

export function MintNFT() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [quantity, setQuantity] = useState(1);

  const userAddress = address || "0x0000000000000000000000000000000000000000";

  const { data, refetch } = useReadContracts({
    contracts: [
      {
        abi: upgradeAbi,
        address: UPGRADE_CONTRACT,
        functionName: "directMintFeeLevel1",
      },
      {
        abi: monchilIdAbi,
        address: NEW_NFT_CONTRACT,
        functionName: "balanceOf",
        args: [userAddress, 1n],
      },
    ],
  });

  const pricePerNft = (data?.[0]?.result as bigint) || BigInt(30 * 1e18);
  const myBalance = (data?.[1]?.result as bigint) || 0n;

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => refetch(), 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  const handleMint = async () => {
    if (!address) return toast.error("Wallet not connected");

    try {
      const totalValue = pricePerNft * BigInt(quantity);

      await writeContractAsync({
        address: UPGRADE_CONTRACT,
        abi: upgradeAbi,
        functionName: "mintLevel1",
        args: [BigInt(quantity)],
        value: totalValue,
      });

      toast.success(`🎉 Minted ${quantity} Monchil Lv 1!`);
      refetch();

      sdk.actions.composeCast({
        text: `I just minted ${quantity} Monchil Lv 1 NFT(s)! ✨ Mint yours now & STAKE to earn $MON`,
        embeds: ["https://monchil.vercel.app"],
      });
    } catch (err) {
      console.error(err);
      toast.error("Mint Failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-white">
      <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-lg w-full text-center mx-auto">
        <h1 className="text-4xl font-black text-pink-600 mb-6 uppercase italic">Mint Monchil</h1>

        <div className="bg-gray-800 border border-purple-700 rounded-2xl p-5 flex flex-col items-center w-full shadow-inner">
          <h2 className="text-xl font-bold text-purple-400 mb-4 uppercase">Monchil Lv 1</h2>

          <img
            src="/1.png"
            alt="Monchil Lv 1"
            className="rounded-xl border-4 border-pink-500 shadow-2xl mb-4 w-56 h-56 object-cover"
          />

          <p className="text-lg font-black text-yellow-400 mb-4">
            Price: {Number(pricePerNft) / 1e18} $MON
          </p>

          <div className="flex items-center justify-center mb-6 gap-6 bg-gray-900 p-2 rounded-full border border-gray-700">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-full text-2xl font-black flex items-center justify-center transition"
            >
              -
            </button>
            <span className="text-3xl font-black w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-full text-2xl font-black flex items-center justify-center transition"
            >
              +
            </button>
          </div>

          <button
            disabled={!isConnected || isPending}
            onClick={handleMint}
            className="w-full bg-purple-600 hover:bg-pink-600 text-white font-black py-4 rounded-xl shadow-lg transition disabled:opacity-50 uppercase tracking-widest"
          >
            {isPending ? "Processing..." : `Confirm Mint (${(Number(pricePerNft) * quantity) / 1e18} $MON)`}
          </button>
        </div>

        {isConnected ? (
          <div className="bg-gray-800 rounded-xl p-4 mt-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2 uppercase font-bold">Your Balance</p>
            <p className="text-2xl font-black text-white mb-4">Lv 1: {Number(myBalance)}</p>

            {myBalance > 0n && (
              <button
                onClick={() =>
                  sdk.actions.composeCast({
                    text: `I've collected ${Number(myBalance)} Monchil Lv 1 NFT — mint yours now & STAKE to earn $MON ✨`,
                    embeds: ["https://monchil.vercel.app"],
                  })
                }
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition uppercase text-sm shadow-md"
              >
                Share My Collection
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 mt-6 animate-pulse">Connect wallet to start minting.</p>
        )}
      </div>
    </div>
  );
}