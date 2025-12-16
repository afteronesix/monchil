import { useState, useMemo } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { abi as abiNFT } from "../hooks/abi/abiNFT";
import { abi as abiSTAKE } from "../hooks/abi/abiSTAKE";
import { monchilIdAbi } from "../hooks/abi/AbiMonchilID";
import { abiNEWSTAKE } from "../hooks/abi/abiStaker";
import { toast } from "react-toastify";
import { formatEther } from "viem";
import { PiggyBank } from "lucide-react";

const OLD_NFT_CONTRACT: `0x${string}` = "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const OLD_STAKING_CONTRACT: `0x${string}` = "0x76F201E7e27Da0dC2EB2c610Cd224380493bb029";
const NEW_NFT_CONTRACT: `0x${string}` = "0x5f052CC161d117154CA4FED968EA037bF9cE4F02";
const NEW_STAKING_CONTRACT: `0x${string}` = "0x506fC18fe0694bA815087d56D505d5802602bc9A";

const NFT_MAPPING = {
    old1: { id: 1, name: "Happy Mon Lv 0", image: "/happy.png", contract: OLD_NFT_CONTRACT, staking: OLD_STAKING_CONTRACT, isOld: true },
    old2: { id: 2, name: "Sad Mon Lv 0", image: "/sad.png", contract: OLD_NFT_CONTRACT, staking: OLD_STAKING_CONTRACT, isOld: true },
    new1: { id: 1, name: "Monchil Lv 1", image: "/1.png", contract: NEW_NFT_CONTRACT, staking: NEW_STAKING_CONTRACT, isOld: false },
    new2: { id: 2, name: "Monchil Lv 2", image: "/2.png", contract: NEW_NFT_CONTRACT, staking: NEW_STAKING_CONTRACT, isOld: false },
} as const;

type CardKey = keyof typeof NFT_MAPPING;

export function StakePage() {
    const [selectedCardId, setSelectedCardId] = useState<CardKey | null>(null);
    const [stakeAmount, setStakeAmount] = useState(1);
    const [unstakeAmount, setUnstakeAmount] = useState(1);

    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    
    const selectedNft = selectedCardId ? NFT_MAPPING[selectedCardId] : null;

    const addressOrDefault = address ?? "0x0000000000000000000000000000000000000000";

    const contracts = useMemo(() => {
        const reads: any[] = [];
        const keys: CardKey[] = ['old1', 'old2', 'new1', 'new2'];

        reads.push({ abi: abiSTAKE, address: OLD_STAKING_CONTRACT, functionName: "rewardRatePerDay", args: [] });

        keys.forEach(key => {
            const nft = NFT_MAPPING[key];
            const nftAbi = nft.isOld ? abiNFT : monchilIdAbi;
            const stakeAbi = nft.isOld ? abiSTAKE : abiNEWSTAKE;

            reads.push({ abi: nftAbi, address: nft.contract, functionName: "balanceOf", args: [addressOrDefault, BigInt(nft.id)] });
            reads.push({ abi: stakeAbi, address: nft.staking, functionName: "userStakes", args: [addressOrDefault, BigInt(nft.id)] });
            reads.push({ abi: stakeAbi, address: nft.staking, functionName: "calculatePendingRewards", args: [addressOrDefault, BigInt(nft.id)] });
            reads.push({ abi: nftAbi, address: nft.contract, functionName: "isApprovedForAll", args: [addressOrDefault, nft.staking] });
        });

        keys.forEach(key => {
            if (!NFT_MAPPING[key].isOld) {
                 reads.push({ abi: abiNEWSTAKE, address: NEW_STAKING_CONTRACT, functionName: "rewardRatesPerDay", args: [BigInt(NFT_MAPPING[key].id)] });
            }
        });
        
        return reads;
    }, [addressOrDefault]);

    const { data: contractData, refetch } = useReadContracts({
        contracts: contracts,
        query: { enabled: isConnected, refetchInterval: 5000 },
    });

    const results = useMemo(() => {
        const data = contractData?.map((r: any) => r?.status === "success" ? r.result : null) ?? [];
        
        const oldGlobalRateWei = data[0] as bigint;
        const oldGlobalRate = parseFloat(formatEther(oldGlobalRateWei ?? 0n));

        const parsed: { [key in CardKey]: { wallet: number, staked: number, reward: number, approved: boolean, dailyRate: number } } = {} as any;
        const keys: CardKey[] = ['old1', 'old2', 'new1', 'new2'];
        
        const getStake = (v: any) => (Array.isArray(v) && v[0] ? Number(v[0]) : 0);
        const toBig = (v: any) => (typeof v === "bigint" ? v : 0n);

        const startIndex = 1; 
        const newRateReadStart = startIndex + (keys.length * 4);
        let newRateIndex = newRateReadStart;

        keys.forEach((key, index) => {
            const i = startIndex + (index * 4);
            const nft = NFT_MAPPING[key];
            
            let dailyRate = 0;
            if (nft.isOld) {
                dailyRate = oldGlobalRate;
            } else {
                const rateWei = toBig(data[newRateIndex]);
                dailyRate = parseFloat(formatEther(rateWei));
                newRateIndex++;
            }

            parsed[key] = {
                wallet: Number(data[i] ?? 0),
                staked: getStake(data[i + 1]),
                reward: parseFloat(formatEther(toBig(data[i + 2]))),
                approved: data[i + 3] === true,
                dailyRate: dailyRate,
            };
        });
        return parsed;
    }, [contractData]);


    const handleApprove = async () => {
        if (!address || !selectedNft) return toast.error("Select NFT and connect wallet");

        const nftAbi = selectedNft.isOld ? abiNFT : monchilIdAbi;
        
        try {
            await writeContractAsync({
                abi: nftAbi,
                address: selectedNft.contract,
                functionName: "setApprovalForAll",
                args: [selectedNft.staking, true],
            });
            toast.success("Approved!");
            refetch();
        } catch {
            toast.error("Approve failed");
        }
    };

    const callStake = async (amount: number) => {
        if (!address || !selectedNft) return toast.error("Select NFT and connect wallet");

        const stakeAbi = selectedNft.isOld ? abiSTAKE : abiNEWSTAKE;
        
        try {
            await writeContractAsync({
                abi: stakeAbi,
                address: selectedNft.staking,
                functionName: "stake",
                args: [BigInt(selectedNft.id), BigInt(amount)],
            });
            toast.success("Staked!");
            refetch();
        } catch {
            toast.error("Stake failed");
        }
    };

    const callUnstake = async (amount: number) => {
        if (!address || !selectedNft) return toast.error("Select NFT and connect wallet");

        const stakeAbi = selectedNft.isOld ? abiSTAKE : abiNEWSTAKE;

        try {
            await writeContractAsync({
                abi: stakeAbi,
                address: selectedNft.staking,
                functionName: "unstake",
                args: [BigInt(selectedNft.id), BigInt(amount)],
            });
            toast.success("Unstaked!");
            refetch();
        } catch {
            toast.error("Unstake failed");
        }
    };

    const callClaim = async () => {
        if (!address || !selectedNft) return toast.error("Select NFT and connect wallet");

        const stakeAbi = selectedNft.isOld ? abiSTAKE : abiNEWSTAKE;

        try {
            await writeContractAsync({
                abi: stakeAbi,
                address: selectedNft.staking,
                functionName: "claimReward",
                args: [BigInt(selectedNft.id)],
            });
            toast.success("Reward claimed!");
            refetch();
        } catch {
            toast.error("Claim failed");
        }
    };

    const renderNftCard = (key: CardKey) => {
        const nft = NFT_MAPPING[key];
        const data = results[key];
        const isSelected = selectedCardId === key;

        return (
            <div
                key={key}
                onClick={() => isConnected ? setSelectedCardId(key) : null}
                className={`relative bg-gray-800 rounded-xl p-3 transition transform duration-300 shadow-lg 
                    ${isConnected ? 'cursor-pointer hover:scale-[1.03]' : 'opacity-60 cursor-default'}
                    ${isSelected ? 'border-4 border-pink-500 ring-2 ring-pink-500' : 'border border-gray-700'}
                `}
            >
                <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-full h-auto rounded-lg mb-2 object-cover" 
                />
                <p className="text-sm font-semibold text-white truncate">{nft.name}</p>
                <p className="text-xs text-gray-400">Wallet: {data.wallet}</p> 
                <p className="text-xs text-purple-400">Staked: {data.staked}</p>
            </div>
        );
    };

    const renderActionPanel = () => {
        if (!isConnected) {
            return <p className="text-gray-400">Connect your wallet to see staking options.</p>;
        }
        
        if (!selectedNft) {
            return <p className="text-gray-400">Select an NFT card to manage staking.</p>;
        }

        const data = results[selectedCardId!];
        const stakeAmountValid = stakeAmount > 0 && stakeAmount <= data.wallet;
        const unstakeAmountValid = unstakeAmount > 0 && unstakeAmount <= data.staked;
        const rewardValid = data.reward > 0.0001;
        
        const formattedDailyRate = data.dailyRate.toFixed(2);

        return (
            <div className="bg-gray-700 p-4 rounded-xl text-left">
                <h3 className="text-xl font-bold text-pink-400 mb-3 flex items-center gap-2">
                    <PiggyBank className="w-5 h-5"/> {selectedNft.name} Staking
                </h3>

                <div className="text-sm bg-gray-800 p-3 rounded-lg mb-4">
                    <p className="text-gray-400">
                        Daily Reward per NFT: 
                        <span className="font-bold text-yellow-400 ml-1">
                            {formattedDailyRate} $MON
                        </span>
                    </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    <div className="bg-gray-800 p-3 rounded-xl">
                        <p className="text-gray-400 text-xs">Wallet</p>
                        <p className="text-white text-lg font-bold">{data.wallet}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-xl">
                        <p className="text-gray-400 text-xs">Staked</p>
                        <p className="text-purple-400 text-lg font-bold">{data.staked}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-xl">
                        <p className="text-gray-400 text-xs">Pending Reward</p>
                        <p className="text-yellow-400 text-lg font-bold">
                            {data.reward.toFixed(4)} $MON
                        </p>
                    </div>
                </div>

                {!data.approved ? (
                    <button
                        onClick={handleApprove}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-xl font-bold transition"
                    >
                        Approve NFT for Staking
                    </button>
                ) : (
                    <>
                        <button
                            onClick={callClaim}
                            disabled={!rewardValid}
                            className={`w-full py-2 rounded-xl font-bold mb-4 transition 
                                ${rewardValid ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                        >
                            Claim {data.reward.toFixed(4)} $MON
                        </button>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="number"
                                min={1}
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(Math.max(1, parseInt(e.target.value || "1")))}
                                className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center"
                            />
                            <button
                                onClick={() => callStake(stakeAmount)}
                                disabled={!stakeAmountValid}
                                className={`flex-1 py-2 rounded-xl font-bold transition 
                                    ${stakeAmountValid ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                            >
                                Stake
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="number"
                                min={1}
                                value={unstakeAmount}
                                onChange={(e) => setUnstakeAmount(Math.max(1, parseInt(e.target.value || "1")))}
                                className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center"
                            />
                            <button
                                onClick={() => callUnstake(unstakeAmount)}
                                disabled={!unstakeAmountValid}
                                className={`flex-1 py-2 rounded-xl font-bold transition 
                                    ${unstakeAmountValid ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                            >
                                Unstake
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4">
            <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-2xl w-full text-center mx-auto">
                <h1 className="4xl font-bold text-pink-600 mb-6">
                    Monchil Staking Center
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {renderNftCard('old1')}
                    {renderNftCard('old2')}
                    {renderNftCard('new1')}
                    {renderNftCard('new2')}
                </div>

                <div className="w-full">
                    {renderActionPanel()}
                </div>
            </div>
        </div>
    );
}