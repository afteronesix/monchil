// MyFaucet.tsx

import { useState, useEffect, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useChainId,
  useWaitForTransactionReceipt,
} from "wagmi";
import { monadTestnet } from "wagmi/chains";
import faucetAbi from "../FaucetABI.json";
import { toast } from "react-toastify";
import { Gift, Clock } from 'lucide-react';

const FAUCET_CONTRACT_ADDRESS = "0xe3eb6CF752d8064311ba1E56661cc37CB524397C";

const formatTime = (seconds: number) => {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export function MyFaucet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending, reset } = useWriteContract();
  const [countdown, setCountdown] = useState(0);

  const useFaucetRead = (functionName: string, args: any[] = []) => {
    return useReadContract({
      address: FAUCET_CONTRACT_ADDRESS,
      abi: faucetAbi,
      functionName,
      args,
      chainId: monadTestnet.id,
      query: {
        refetchOnWindowFocus: true,
      },
    });
  };

  const { data: userStreak, refetch: refetchUserStreak } = useFaucetRead("streaks", [address || "0x0"]);
  const { data: canUserClaim, refetch: refetchCanUserClaim } = useFaucetRead("canClaim", [address || "0x0"]);
  const { data: lastClaimTimestamp, refetch: refetchLastClaim } = useFaucetRead("lastClaimTime", [address || "0x0"]);
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const isClaiming = isPending || isConfirming;

  const refreshAllData = useCallback(() => {
    if (address) {
      refetchUserStreak();
      refetchCanUserClaim();
      refetchLastClaim();
    }
  }, [address, refetchUserStreak, refetchCanUserClaim, refetchLastClaim]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success("🎉 Successfully claimed your daily MON!");
      setCountdown(24 * 60 * 60);
      refreshAllData();
      sdk.actions.composeCast({
        text: `I just claimed my daily MON from the Monchil Faucet! 🔥`,
        embeds: ["https://monchil.vercel.app"],
      });
      reset();
    }
  }, [isConfirmed, refreshAllData, reset]);

  useEffect(() => {
    if (typeof lastClaimTimestamp === 'undefined') return;

    if (Number(lastClaimTimestamp) === 0) {
      setCountdown(0);
      return;
    }

    const cooldownEndTime = Number(lastClaimTimestamp) + (24 * 60 * 60);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const secondsLeft = cooldownEndTime - nowInSeconds;

    setCountdown(secondsLeft > 0 ? secondsLeft : 0);
  }, [lastClaimTimestamp]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          refreshAllData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, refreshAllData]);

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: monadTestnet.id });
      toast.success("Switched to Monad Testnet");
    } catch (error) {
      toast.error("Failed to switch chain");
    }
  };

  const handleClaim = async () => {
    if (!address) return toast.error("Wallet not connected");
    if (chainId !== monadTestnet.id) return toast.warning("Please switch to Monad Testnet");
    if (!canUserClaim) return toast.info("Please wait for the cooldown to finish.");

    try {
      await writeContractAsync({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: faucetAbi,
        functionName: "claim",
      });
    } catch (err) {
      toast.error("Claim Failed or Rejected.");
      console.error(err);
    }
  };
  
  const buttonDisabled = isClaiming || !canUserClaim;

  return (
    <div className="flex items-center justify-center h-full">
        <div className="bg-gray-900 border border-purple-700 rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-purple-400 mb-2">Daily Faucet</h1>
            <p className="text-sm text-gray-400 mb-4">
                Claim your daily testnet MON and get a bonus for a 3-day streak!
            </p>
            
            <Gift className="text-7xl text-pink-400 mx-auto my-6" />
            
            <div className="bg-black/20 border-2 border-purple-800 rounded-lg p-3 mb-6 text-sm">
                <p className="text-purple-300">1 Day Claim: <span className="font-bold">0.015 $MON</span></p>
                <p className="text-purple-300">3-Day Streak Bonus: <span className="font-bold">0.05 $MON</span></p>
            </div>

            {isConnected && chainId !== monadTestnet.id && (
                <button
                    onClick={handleSwitchChain}
                    className="mb-4 bg-yellow-400 text-yellow-900 py-2 px-4 rounded-lg font-bold shadow-md hover:bg-yellow-500 transition-colors"
                >
                    Switch to Monad
                </button>
            )}

            <div className="mb-4 text-lg text-gray-300">
                Your Current Streak: <strong>{Number(userStreak || 0)} Day(s)</strong>
            </div>

            {isConnected ? (
                <button
                    disabled={buttonDisabled}
                    onClick={handleClaim}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? "Sending..." : 
                     isConfirming ? "Confirming..." : 
                     !canUserClaim ? <><Clock size={18} /><span>{formatTime(countdown)}</span></> : 
                     "Claim Now!"
                    }
                </button>
            ) : (
                <p className="text-gray-400 mt-4">Connect your wallet to claim.</p>
            )}
        </div>
    </div>
  );
}