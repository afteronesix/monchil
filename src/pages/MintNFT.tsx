// MintNFT.tsx
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { abi } from "../hooks/abiNFT";
import { toast } from "react-toastify";

const CONTRACT_ADDRESS: `0x${string}` =
  "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const PRICE_PER_NFT = 1;
const MAX_SUPPLY_PER_ID = 2500;

const nftTypes = {
  happy: {
    id: 1,
    name: "Happy Mon",
    image: "/happy.png",
  },
  sad: {
    id: 2,
    name: "Sad Mon",
    image: "/sad.png",
  },
};

function MintModule({
  nft,
  onMint,
  isPending,
  isConnected,
}: {
  nft: { id: number; name: string; image: string };
  onMint: (tokenId: number, quantity: number) => void;
  isPending: boolean;
  isConnected: boolean;
}) {
  const [quantity, setQuantity] = useState(1);

  const handleMintClick = () => {
    onMint(nft.id, quantity);
  };

  return (
    <div className="bg-gray-800 border border-purple-700 rounded-2xl p-4 flex flex-col items-center w-72">
      <h2 className="text-xl font-bold text-purple-500 mb-2">{nft.name}</h2>
      <img
        src={nft.image}
        alt={nft.name}
        className="rounded-xl border-4 border-pink-200 shadow-md mb-3 w-48 h-48 object-cover"
      />
      <p className="text-lg font-semibold text-gray-300 mb-3">
        Price: {PRICE_PER_NFT} MON
      </p>

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

      <button
        disabled={!isConnected || isPending}
        onClick={handleMintClick}
        className="w-full bg-purple-500 hover:bg-pink-600 text-white font-bold py-2 rounded-xl shadow-md transition disabled:opacity-50"
      >
        {isPending ? "Processing..." : `Mint ${quantity}`}
      </button>
    </div>
  );
}

export function MintNFT() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

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
    data?.map((d) => (d.status === "success" ? d.result : 0)) || [0, 0, 0, 0];

  const hasNFT = Number(yourMintedHappy) > 0 || Number(yourMintedSad) > 0;

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => refetch(), 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  const handleMint = async (tokenId: number, quantity: number) => {
    if (!address) return toast.error("Wallet not connected");

    try {
      const value = BigInt(Math.round(PRICE_PER_NFT * quantity * 1e18));

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [BigInt(tokenId), BigInt(quantity)],
        value,
      });

      const nftName = tokenId === 1 ? "Happy Mon" : "Sad Mon";
      toast.success(`🎉 Successfully minted ${quantity} ${nftName}(s)!`);

      refetch();

      sdk.actions.composeCast({
        text: `I just minted ${quantity} ${nftName} NFT(s) ✨ Get yours too!`,
        embeds: ["https://monchil.vercel.app"],
      });
    } catch (err) {
      console.error(err);
      toast.error("Mint Failed.");
    }
  };

  const handleManualShare = () => {
    sdk.actions.composeCast({
      text: "I've collected a Monchil NFT — go mint yours too! ✨",
      embeds: ["https://monchil.vercel.app"],
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-4xl w-full text-center mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">
          Mint Your Monchil
        </h1>

        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-6">
          <MintModule
            nft={nftTypes.happy}
            onMint={handleMint}
            isPending={isPending}
            isConnected={isConnected}
          />

          <MintModule
            nft={nftTypes.sad}
            onMint={handleMint}
            isPending={isPending}
            isConnected={isConnected}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-8 mb-4 text-sm text-gray-400">
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
                onClick={handleManualShare}
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
