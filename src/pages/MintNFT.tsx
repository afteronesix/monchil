// MintNFT.tsx
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import { abi } from "../hooks/abiNFT";
import { toast } from "react-toastify";

const CONTRACT_ADDRESS: `0x${string}` = "0x8162454d056D50FD2f4A3eb2Ab52bBA9978f4CfA"; 
const PRICE_PER_NFT = 0.5;
const MAX_SUPPLY_PER_ID = 5000000;

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
  chainId,
}: {
  nft: { id: number; name: string; image: string };
  onMint: (tokenId: number, quantity: number) => void;
  isPending: boolean;
  isConnected: boolean;
  chainId: number | undefined;
}) {
  const [quantity, setQuantity] = useState(1);

  const handleMintClick = () => {
    if (chainId !== monadTestnet.id) {
       toast.warning("Please switch to Monad Testnet first!");
       return;
    }
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
        <span className="text-2xl font-bold w-10 text-center">{quantity}</span>
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
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();

  const contractConfig = {
    abi,
    address: CONTRACT_ADDRESS,
    chainId: monadTestnet.id,
  } as const;

  const { data, refetch } = useReadContracts({
    contracts: [
      { ...contractConfig, functionName: "totalSupply", args: [BigInt(nftTypes.happy.id)] },
      { ...contractConfig, functionName: "totalSupply", args: [BigInt(nftTypes.sad.id)] },
      { ...contractConfig, functionName: "balanceOf", args: [address || "0x0000000000000000000000000000000000000000", BigInt(nftTypes.happy.id)] },
      { ...contractConfig, functionName: "balanceOf", args: [address || "0x0000000000000000000000000000000000000000", BigInt(nftTypes.sad.id)] },
    ],
  });

  const [
    totalMintedHappy,
    totalMintedSad,
    yourMintedHappy,
    yourMintedSad
  ] = data?.map(d => (d.status === 'success' ? d.result : 0)) || [0, 0, 0, 0];

  const hasNFT = Number(yourMintedHappy) > 0 || Number(yourMintedSad) > 0;

  useEffect(() => {
    if(isConnected) {
        const interval = setInterval(() => refetch(), 10000);
        return () => clearInterval(interval);
    }
  }, [isConnected, refetch]);

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
      toast.success("Switched to Monad Testnet");
    } catch (error) {
      toast.error("Failed to switch chain");
    }
  };

  const handleMint = async (tokenId: number, quantity: number) => {
    if (!address) return toast.error("Wallet not connected");

    try {
      const value = BigInt(Math.round(PRICE_PER_NFT * quantity * 1e18));
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mint",
        args: [BigInt(tokenId), BigInt(quantity)],
        value: value,
      });
      
      const nftName = tokenId === 1 ? "Happy Mon" : "Sad Mon";
      toast.success(`🎉 Successfully minted ${quantity} ${nftName}(s)!`);
      refetch();
      sdk.actions.composeCast({
        text: `I just minted ${quantity} ${nftName} NFT(s) ✨ I hope there will be an airdrop in the future — get yours now! 🚀`,
        embeds: ["https://monchil.vercel.app"],
      });

    } catch (err) {
      toast.error("Mint Failed.");
      console.error(err);
    }
  };
  
  const handleManualShare = () => {
    sdk.actions.composeCast({
        text: "I've collected a Monchil NFT and I hope there will be an airdrop in the future. Get yours too! ✨",
        embeds: ["https://monchil.vercel.app"],
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-4xl w-full text-center mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-2">Mint Your Monchil</h1>

        {isConnected && chainId !== monadTestnet.id && (
          <button
            onClick={handleSwitchChain}
            className="mb-6 bg-yellow-400 text-yellow-900 py-2 px-4 rounded-lg font-bold shadow-md hover:bg-yellow-500 transition-colors"
          >
            Switch to Monad
          </button>
        )}
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-6">
          <MintModule 
            nft={nftTypes.happy} 
            onMint={handleMint}
            isPending={isPending}
            isConnected={isConnected}
            chainId={chainId}
          />
          <MintModule 
            nft={nftTypes.sad} 
            onMint={handleMint}
            isPending={isPending}
            isConnected={isConnected}
            chainId={chainId}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-8 mb-4 text-sm text-gray-400">
           <p>Happy Minted: <strong>{Number(totalMintedHappy)} / {MAX_SUPPLY_PER_ID}</strong></p>
           <p>Sad Minted: <strong>{Number(totalMintedSad)} / {MAX_SUPPLY_PER_ID}</strong></p>
        </div>

        {isConnected ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-purple-400">Your Collection</h3>
            <div className="flex justify-center gap-8 text-white mb-4">
                <p>Happy Mon: <strong>{Number(yourMintedHappy)}</strong></p>
                <p>Sad Mon: <strong>{Number(yourMintedSad)}</strong></p>
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
          <p className="text-gray-500 mt-4">Connect your wallet to get started.</p>
        )}
      </div>
    </div>
  );
}
