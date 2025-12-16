// MintNFT.tsx
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { abi } from "../hooks/abi/abiNFT";
import { toast } from "react-toastify";

const CONTRACT_ADDRESS: `0x${string}` =
  "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";

const PRICE_PER_NFT = 1;
const MAX_SUPPLY_PER_ID = 2500;

const nftTypes = {
  happy: { id: 1, name: "Happy Mon", image: "/happy.png" },
  sad: { id: 2, name: "Sad Mon", image: "/sad.png" },
};

export function MintNFT() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const [selectedType, setSelectedType] = useState<"happy" | "sad">("happy");
  const [quantity, setQuantity] = useState(1);

  const currentNFT = nftTypes[selectedType];

  const contractConfig = {
    abi,
    address: CONTRACT_ADDRESS,
  } as const;

  const { data, refetch } = useReadContracts({
    contracts: [
      {
        ...contractConfig,
        functionName: "totalSupply",
        args: [BigInt(nftTypes.happy.id)],
      },
      {
        ...contractConfig,
        functionName: "totalSupply",
        args: [BigInt(nftTypes.sad.id)],
      },
      {
        ...contractConfig,
        functionName: "balanceOf",
        args: [
          address || "0x0000000000000000000000000000000000000000",
          BigInt(nftTypes.happy.id),
        ],
      },
      {
        ...contractConfig,
        functionName: "balanceOf",
        args: [
          address || "0x0000000000000000000000000000000000000000",
          BigInt(nftTypes.sad.id),
        ],
      },
    ],
  });

  const [totalMintedHappy, totalMintedSad, yourMintedHappy, yourMintedSad] =
    data?.map((d) => (d.status === "success" ? d.result : 0)) ?? [0, 0, 0, 0];

  const hasNFT = Number(yourMintedHappy) > 0 || Number(yourMintedSad) > 0;

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => refetch(), 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  const handleMint = async () => {
    if (!address) return toast.error("Wallet not connected");

    try {
      const value = BigInt(Math.round(PRICE_PER_NFT * quantity * 1e18));

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [BigInt(currentNFT.id), BigInt(quantity)],
        value,
      });

      toast.success(
        `🎉 Successfully minted ${quantity} ${currentNFT.name}(s)!`
      );

      refetch();

      sdk.actions.composeCast({
        text: `I just minted ${quantity} ${currentNFT.name} NFT(s)!✨ Mint your Monchil Now & STAKE to earn $MON`,
        embeds: ["https://monchil.vercel.app"],
      });
    } catch (err) {
      console.error(err);
      toast.error("Mint Failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-lg w-full text-center mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-6">
          Mint Your Monchil
        </h1>

        {/* 🔥 SELECTOR HAPPY / SAD */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setSelectedType("happy")}
            className={`px-4 py-2 rounded-xl font-bold ${
              selectedType === "happy"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Happy
          </button>

          <button
            onClick={() => setSelectedType("sad")}
            className={`px-4 py-2 rounded-xl font-bold ${
              selectedType === "sad"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Sad
          </button>
        </div>

        {/* 🔥 ONLY ONE CARD DISPLAYED */}
        <div className="bg-gray-800 border border-purple-700 rounded-2xl p-5 flex flex-col items-center w-full">
          <h2 className="text-xl font-bold text-purple-500 mb-2">
            {currentNFT.name}
          </h2>

          <img
            src={currentNFT.image}
            alt={currentNFT.name}
            className="rounded-xl border-4 border-pink-200 shadow-md mb-3 w-48 h-48 object-cover"
          />

          <p className="text-lg font-semibold text-gray-300 mb-3">
            Price: {PRICE_PER_NFT} MON
          </p>

          {/* Quantity */}
          <div className="flex items-center justify-center mb-4 gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="bg-pink-200 text-pink-700 w-8 h-8 rounded-full text-xl font-bold flex items-center justify-center"
            >
              -
            </button>

            <span className="text-2xl font-bold w-10 text-center">
              {quantity}
            </span>

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="bg-pink-200 text-pink-700 w-8 h-8 rounded-full text-xl font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* 🔥 ONE MINT BUTTON */}
          <button
            disabled={!isConnected || isPending}
            onClick={handleMint}
            className="w-full bg-purple-500 hover:bg-pink-600 text-white font-bold py-2 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {isPending ? "Processing..." : `Mint ${quantity}`}
          </button>
        </div>

        {/* SUPPLY INFO */}
        <div className="flex flex-col md:flex-row justify-center gap-8 mt-6 mb-4 text-sm text-gray-400">
          <p>
            Happy Minted:{" "}
            <strong>
              {Number(totalMintedHappy)} / {MAX_SUPPLY_PER_ID}
            </strong>
          </p>

          <p>
            Sad Minted:{" "}
            <strong>
              {Number(totalMintedSad)} / {MAX_SUPPLY_PER_ID}
            </strong>
          </p>
        </div>

        {/* USER COLLECTION */}
        {isConnected ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-purple-400">
              Your Collection
            </h3>

            <div className="flex justify-center gap-8 text-white mb-4">
              <p>
                Happy Mon: <strong>{Number(yourMintedHappy)}</strong>
              </p>
              <p>
                Sad Mon: <strong>{Number(yourMintedSad)}</strong>
              </p>
            </div>

            {hasNFT && (
              <button
                onClick={() =>
                  sdk.actions.composeCast({
                    text: "I've collected a Monchil NFT — go mint yours too & STAKE to earn $MON✨",
                    embeds: ["https://monchil.vercel.app"],
                  })
                }
                className="w-full max-w-xs mx-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition"
              >
                Share My Collection!
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Connect your wallet to continue.</p>
        )}
      </div>
    </div>
  );
}
