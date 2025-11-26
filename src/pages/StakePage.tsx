import { useState } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { abi as abiNFT } from "../hooks/abiNFT";
import { abi as abiSTAKE } from "../hooks/abiSTAKE";
import { toast } from "react-toastify";
import { formatEther } from "viem";

const NFT_CONTRACT_ADDRESS: `0x${string}` =
  "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const STAKING_CONTRACT_ADDRESS: `0x${string}` =
  "0x76F201E7e27Da0dC2EB2c610Cd224380493bb029";

const nftTypes = {
  happy: { id: 1, name: "Happy Mon", image: "/happy.png" },
  sad: { id: 2, name: "Sad Mon", image: "/sad.png" },
} as const;

type NFTKey = keyof typeof nftTypes;

export function StakePage() {
  const [selected, setSelected] = useState<NFTKey>("happy");
  const [stakeAmount, setStakeAmount] = useState(1);
  const [unstakeAmount, setUnstakeAmount] = useState(1);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const nftContract = { abi: abiNFT, address: NFT_CONTRACT_ADDRESS };
  const stakeContract = { abi: abiSTAKE, address: STAKING_CONTRACT_ADDRESS };

  const { data, refetch } = useReadContracts({
    contracts: [
      {
        ...nftContract,
        functionName: "balanceOf",
        args: [address ?? "0x0", 1n],
      },
      {
        ...nftContract,
        functionName: "balanceOf",
        args: [address ?? "0x0", 2n],
      },
      {
        ...stakeContract,
        functionName: "userStakes",
        args: [address ?? "0x0", 1n],
      },
      {
        ...stakeContract,
        functionName: "userStakes",
        args: [address ?? "0x0", 2n],
      },
      {
        ...stakeContract,
        functionName: "calculatePendingRewards",
        args: [address ?? "0x0", 1n],
      },
      {
        ...stakeContract,
        functionName: "calculatePendingRewards",
        args: [address ?? "0x0", 2n],
      },
      {
        ...nftContract,
        functionName: "isApprovedForAll",
        args: [address ?? "0x0", STAKING_CONTRACT_ADDRESS],
      },
    ],
    query: { enabled: !!address, refetchInterval: 2000 },
  });

  const result = (data ?? []).map((r: any) =>
    r?.status === "success" ? r.result : null
  );

  const happyBal = Number(result[0] ?? 0);
  const sadBal = Number(result[1] ?? 0);

  const getStake = (v: any) => (Array.isArray(v) && v[0] ? Number(v[0]) : 0);

  const happyStaked = getStake(result[2]);
  const sadStaked = getStake(result[3]);

  const toBig = (v: any) => (typeof v === "bigint" ? v : 0n);

  const rewardHappy = parseFloat(formatEther(toBig(result[4])));
  const rewardSad = parseFloat(formatEther(toBig(result[5])));

  const approved = result[6] === true;

  const nft = nftTypes[selected];
  const walletBalance = selected === "happy" ? happyBal : sadBal;
  const stakedBalance = selected === "happy" ? happyStaked : sadStaked;
  const pendingReward = selected === "happy" ? rewardHappy : rewardSad;

  const handleApprove = async () => {
    if (!address) return toast.error("Wallet not connected");
    try {
      await writeContractAsync({
        ...nftContract,
        functionName: "setApprovalForAll",
        args: [STAKING_CONTRACT_ADDRESS, true],
      });
      toast.success("Approved!");
      refetch();
    } catch {
      toast.error("Approve failed");
    }
  };

  const callStake = async (amount: number) => {
    try {
      await writeContractAsync({
        ...stakeContract,
        functionName: "stake",
        args: [BigInt(nft.id), BigInt(amount)],
      });
      toast.success("Staked!");
      refetch();
    } catch {
      toast.error("Stake failed");
    }
  };

  const callUnstake = async (amount: number) => {
    try {
      await writeContractAsync({
        ...stakeContract,
        functionName: "unstake",
        args: [BigInt(nft.id), BigInt(amount)],
      });
      toast.success("Unstaked!");
      refetch();
    } catch {
      toast.error("Unstake failed");
    }
  };

  const callClaim = async () => {
    try {
      await writeContractAsync({
        ...stakeContract,
        functionName: "claimReward",
        args: [BigInt(nft.id)],
      });
      toast.success("Reward claimed!");
      refetch();
    } catch {
      toast.error("Claim failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 p-4">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-purple-700 max-w-md w-full text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-600 mb-5">
          Select NFT Type
        </h1>

        <div className="flex justify-center gap-6 mb-4">
          {(["happy", "sad"] as NFTKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-5 py-3 rounded-xl font-semibold transition border
                ${
                  selected === key
                    ? "bg-purple-600 border-purple-300 text-white"
                    : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
            >
              {nftTypes[key].name}
            </button>
          ))}
        </div>

        <img
          src={nft.image}
          className="w-40 h-40 object-cover rounded-xl mx-auto border-4 border-purple-500 shadow-lg"
        />
      </div>

      {/* REWARD + STAKE CARD */}
      <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-purple-800 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">
          Your {nft.name}
        </h2>

        <div className="grid grid-cols-3 gap-3 text-center mb-6">
          <div className="bg-gray-800 p-3 rounded-xl">
            <p className="text-gray-400 text-sm">Wallet</p>
            <p className="text-pink-400 text-xl font-bold">{walletBalance}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <p className="text-gray-400 text-sm">Staked</p>
            <p className="text-purple-400 text-xl font-bold">{stakedBalance}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl">
            <p className="text-gray-400 text-sm">Reward</p>
            <p className="text-yellow-400 text-xl font-bold">
              {pendingReward.toFixed(4)}
            </p>
          </div>
        </div>

        {!approved ? (
          <button
            onClick={handleApprove}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold"
          >
            Approve Staking
          </button>
        ) : (
          <>
            <button
              onClick={callClaim}
              disabled={pendingReward === 0}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-xl font-bold mb-5"
            >
              Claim Reward
            </button>

            <div className="flex gap-2 mb-4">
              <input
                type="number"
                min={1}
                value={stakeAmount}
                onChange={(e) =>
                  setStakeAmount(parseInt(e.target.value || "1"))
                }
                className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center"
              />
              <button
                onClick={() => callStake(stakeAmount)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold"
              >
                Stake
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={unstakeAmount}
                onChange={(e) =>
                  setUnstakeAmount(parseInt(e.target.value || "1"))
                }
                className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center"
              />
              <button
                onClick={() => callUnstake(unstakeAmount)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-bold"
              >
                Unstake
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
