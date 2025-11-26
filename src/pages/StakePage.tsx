// src/pages/StakePage.tsx

import { useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { abi as abiNFT } from "../hooks/abiNFT";
import { abi as abiSTAKE } from "../hooks/abiSTAKE";
import { toast } from "react-toastify";
import { formatEther } from "viem";

const NFT_CONTRACT_ADDRESS: `0x${string}` =
  "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const STAKING_CONTRACT_ADDRESS: `0x${string}` =
  "0x76F201E7e27Da0dC2EB2c610Cd224380493bb029";

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

type NFTData = {
  id: number;
  name: string;
  image: string;
};

type StakeModuleProps = {
  nft: NFTData;
  walletBalance: number;
  stakedBalance: number;
  isPending: boolean;
  onStake: (tokenId: number, amount: number) => void;
  onUnstake: (tokenId: number, amount: number) => void;
};

function StakeModule({
  nft,
  walletBalance,
  stakedBalance,
  isPending,
  onStake,
  onUnstake,
}: StakeModuleProps) {
  const [stakeAmount, setStakeAmount] = useState(1);
  const [unstakeAmount, setUnstakeAmount] = useState(1);

  return (
    <div className="bg-gray-800 border border-purple-700 rounded-2xl p-4 w-full md:w-80">
      <h2 className="text-xl font-bold text-purple-500 mb-2">{nft.name}</h2>
      <img
        src={nft.image}
        alt={nft.name}
        className="rounded-xl border-4 border-pink-200 shadow-md mb-3 w-48 h-48 object-cover mx-auto"
      />

      <div className="text-left mb-4">
        <p className="text-white">
          In Wallet: <strong className="text-pink-400">{walletBalance}</strong>
        </p>
        <p className="text-white">
          Staked: <strong className="text-purple-400">{stakedBalance}</strong>
        </p>
      </div>

      {/* Stake */}
      <div className="space-y-2 mb-4">
        <input
          type="number"
          min="1"
          value={stakeAmount}
          onChange={(e) =>
            setStakeAmount(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-full bg-gray-700 text-white p-2 rounded-lg text-center"
        />
        <button
          onClick={() => onStake(nft.id, stakeAmount)}
          disabled={isPending || walletBalance === 0}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl shadow-md transition disabled:opacity-50"
        >
          {isPending ? "Processing..." : `Stake ${stakeAmount}`}
        </button>
      </div>

      {/* Unstake */}
      <div className="space-y-2">
        <input
          type="number"
          min="1"
          value={unstakeAmount}
          onChange={(e) =>
            setUnstakeAmount(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-full bg-gray-700 text-white p-2 rounded-lg text-center"
        />
        <button
          onClick={() => onUnstake(nft.id, unstakeAmount)}
          disabled={isPending || stakedBalance === 0}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl shadow-md transition disabled:opacity-50"
        >
          {isPending ? "Processing..." : `Unstake ${unstakeAmount}`}
        </button>
      </div>
    </div>
  );
}

export function StakePage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const nftContract = { abi: abiNFT, address: NFT_CONTRACT_ADDRESS } as const;
  const stakeContract = {
    abi: abiSTAKE,
    address: STAKING_CONTRACT_ADDRESS,
  } as const;

  const { data, refetch } = useReadContracts({
    contracts: [
      { ...nftContract, functionName: "balanceOf", args: [address ?? "0x0", BigInt(1)] },
      { ...nftContract, functionName: "balanceOf", args: [address ?? "0x0", BigInt(2)] },
      { ...stakeContract, functionName: "userStakes", args: [address ?? "0x0", BigInt(1)] },
      { ...stakeContract, functionName: "userStakes", args: [address ?? "0x0", BigInt(2)] },
      { ...stakeContract, functionName: "calculatePendingRewards", args: [address ?? "0x0", BigInt(1)] },
      { ...stakeContract, functionName: "calculatePendingRewards", args: [address ?? "0x0", BigInt(2)] },
      { ...nftContract, functionName: "isApprovedForAll", args: [address ?? "0x0", STAKING_CONTRACT_ADDRESS] },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
    },
  });

  const [
    happyBalance,
    sadBalance,
    happyStakeInfo,
    sadStakeInfo,
    happyRewards,
    sadRewards,
    isApproved,
  ] = data?.map((d) => (d.status === "success" ? d.result : null)) || [];

  const happyInWallet = Number(happyBalance || 0);
  const sadInWallet = Number(sadBalance || 0);
  const happyStaked = Number((happyStakeInfo as readonly [bigint, bigint])?.[0] || 0);
  const sadStaked = Number((sadStakeInfo as readonly [bigint, bigint])?.[0] || 0);

  const pendingHappyEth = happyRewards
    ? formatEther(happyRewards as bigint)
    : "0.0";
  const pendingSadEth = sadRewards ? formatEther(sadRewards as bigint) : "0.0";

  const isStakingApproved = Boolean(isApproved);

  
  const handleApprove = async () => {
    if (!address) return toast.error("Wallet not connected");

    toast.info("Sending approval transaction...");
    try {
      await writeContractAsync({
        ...nftContract,
        functionName: "setApprovalForAll",
        args: [STAKING_CONTRACT_ADDRESS, true],
      });
      toast.success("Approval successful!");
      refetch();
    } catch (e) {
      toast.error("Approval failed.");
      console.error(e);
    }
  };

  const handleContractInteraction = async (
    functionName: "stake" | "unstake" | "claimReward",
    args: [bigint, bigint] | [bigint],
    successMessage: string
  ) => {
    if (!address) return toast.error("Wallet not connected");

    toast.info("Sending transaction...");
    try {
      await writeContractAsync({
        ...stakeContract,
        functionName,
        args: args as any,
      });
      toast.success(successMessage);
      refetch();
    } catch (e) {
      toast.error("Transaction failed.");
      console.error(e);
    }
  };

  return (
    <div className="flex items-center justify-start min-h-screen p-4 pt-16">
      <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-4xl w-full text-center mx-auto">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">
          Stake Your Monchil
        </h1>

        {!isConnected ? (
          <p className="text-gray-500 mt-4">Connect your wallet to start.</p>
        ) : !isStakingApproved ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">
              Approval Required
            </h2>
            <p className="text-gray-300 mb-6">
              Approve staking contract before staking your NFTs.
            </p>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full max-w-xs mx-auto bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isPending ? "Approving..." : "Approve"}
            </button>
          </div>
        ) : (
          <>
            {/* Rewards */}
            <div className="bg-gray-800 border border-purple-700 rounded-2xl p-4 mb-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">
                Your Rewards
              </h2>

              <div className="flex flex-col md:flex-row justify-around gap-4">
                {/* Happy */}
                <div className="flex-1 bg-gray-900 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Happy Mon Rewards</p>
                  <p className="text-2xl font-bold text-yellow-400 truncate">
                    {parseFloat(pendingHappyEth).toFixed(6)} MON
                  </p>
                  <button
                    onClick={() =>
                      handleContractInteraction(
                        "claimReward",
                        [BigInt(1)],
                        "Happy Mon rewards claimed!"
                      )
                    }
                    disabled={isPending || parseFloat(pendingHappyEth) === 0}
                    className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg shadow-md transition disabled:opacity-50"
                  >
                    Claim
                  </button>
                </div>

                {/* Sad */}
                <div className="flex-1 bg-gray-900 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Sad Mon Rewards</p>
                  <p className="text-2xl font-bold text-yellow-400 truncate">
                    {parseFloat(pendingSadEth).toFixed(6)} MON
                  </p>
                  <button
                    onClick={() =>
                      handleContractInteraction(
                        "claimReward",
                        [BigInt(2)],
                        "Sad Mon rewards claimed!"
                      )
                    }
                    disabled={isPending || parseFloat(pendingSadEth) === 0}
                    className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-lg shadow-md transition disabled:opacity-50"
                  >
                    Claim
                  </button>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="flex flex-col md:flex-row justify-center items-start gap-8">
              <StakeModule
                nft={nftTypes.happy}
                walletBalance={happyInWallet}
                stakedBalance={happyStaked}
                isPending={isPending}
                onStake={(tokenId, amount) =>
                  handleContractInteraction(
                    "stake",
                    [BigInt(tokenId), BigInt(amount)],
                    "Stake successful!"
                  )
                }
                onUnstake={(tokenId, amount) =>
                  handleContractInteraction(
                    "unstake",
                    [BigInt(tokenId), BigInt(amount)],
                    "Unstake successful!"
                  )
                }
              />

              <StakeModule
                nft={nftTypes.sad}
                walletBalance={sadInWallet}
                stakedBalance={sadStaked}
                isPending={isPending}
                onStake={(tokenId, amount) =>
                  handleContractInteraction(
                    "stake",
                    [BigInt(tokenId), BigInt(amount)],
                    "Stake successful!"
                  )
                }
                onUnstake={(tokenId, amount) =>
                  handleContractInteraction(
                    "unstake",
                    [BigInt(tokenId), BigInt(amount)],
                    "Unstake successful!"
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
