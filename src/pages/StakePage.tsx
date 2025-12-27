import { useState, useMemo } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { abi as abiNFT } from "../hooks/abi/abiNFT";
import { abi as abiSTAKE } from "../hooks/abi/abiSTAKE";
import { monchilIdAbi } from "../hooks/abi/AbiMonchilID";
import { abiNEWSTAKE } from "../hooks/abi/abiStaker";
import { toast } from "react-toastify";
import { formatEther } from "viem";
import { PiggyBank, AlertTriangle } from "lucide-react";

const OLD_NFT_CONTRACT: `0x${string}` = "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const OLD_STAKING_CONTRACT: `0x${string}` = "0x76F201E7e27Da0dC2EB2c610Cd224380493bb029";
const NEW_NFT_CONTRACT: `0x${string}` = "0x5f052CC161d117154CA4FED968EA037bF9cE4F02";
const NEW_STAKING_CONTRACT: `0x${string}` = "0x506fC18fe0694bA815087d56D505d5802602bc9A";

const NFT_MAPPING = {
    old1: { ids: [1, 3, 5, 7, 9], name: "Happy Mon Lv 0", image: "/happy.png", contract: OLD_NFT_CONTRACT, staking: OLD_STAKING_CONTRACT, isOld: true },
    old2: { ids: [2, 4, 6, 8, 10], name: "Sad Mon Lv 0", image: "/sad.png", contract: OLD_NFT_CONTRACT, staking: OLD_STAKING_CONTRACT, isOld: true },
    new1: { ids: [1], name: "Monchil Lv 1", image: "/1.png", contract: NEW_NFT_CONTRACT, staking: NEW_STAKING_CONTRACT, isOld: false },
    new2: { ids: [2], name: "Monchil Lv 2", image: "/2.png", contract: NEW_NFT_CONTRACT, staking: NEW_STAKING_CONTRACT, isOld: false },
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
            nft.ids.forEach(id => {
                reads.push({ abi: nftAbi, address: nft.contract, functionName: "balanceOf", args: [addressOrDefault, BigInt(id)] });
                reads.push({ abi: stakeAbi, address: nft.staking, functionName: "userStakes", args: [addressOrDefault, BigInt(id)] });
                reads.push({ abi: stakeAbi, address: nft.staking, functionName: "calculatePendingRewards", args: [addressOrDefault, BigInt(id)] });
                reads.push({ abi: nftAbi, address: nft.contract, functionName: "isApprovedForAll", args: [addressOrDefault, nft.staking] });
            });
        });
        keys.forEach(key => {
            if (!NFT_MAPPING[key].isOld) {
                NFT_MAPPING[key].ids.forEach(id => {
                    reads.push({ abi: abiNEWSTAKE, address: NEW_STAKING_CONTRACT, functionName: "rewardRatesPerDay", args: [BigInt(id)] });
                });
            }
        });
        return reads;
    }, [addressOrDefault]);

    const { data: contractData, refetch } = useReadContracts({
        contracts: contracts as any,
        query: { enabled: isConnected, refetchInterval: 5000 },
    });

    const results = useMemo(() => {
        const data = contractData?.map((r: any) => r?.status === "success" ? r.result : null) ?? [];
        const oldGlobalRate = parseFloat(formatEther((data[0] as bigint) ?? 0n));
        const parsed: { [key in CardKey]: { wallet: number, staked: number, reward: number, approved: boolean, dailyRate: number } } = {} as any;
        const keys: CardKey[] = ['old1', 'old2', 'new1', 'new2'];
        const getStake = (v: any) => (Array.isArray(v) && v[0] ? Number(v[0]) : 0);
        const toBig = (v: any) => (typeof v === "bigint" ? v : 0n);

        let dataIdx = 1;
        let rateIdx = 1 + keys.reduce((acc, key) => acc + (NFT_MAPPING[key].ids.length * 4), 0);

        keys.forEach(key => {
            const nft = NFT_MAPPING[key];
            let wallet = 0, staked = 0, reward = 0, approved = true, dailyRate = 0;
            nft.ids.forEach(() => {
                wallet += Number(data[dataIdx] ?? 0);
                staked += getStake(data[dataIdx + 1]);
                reward += parseFloat(formatEther(toBig(data[dataIdx + 2])));
                if (data[dataIdx + 3] === false) approved = false;
                if (nft.isOld) dailyRate = oldGlobalRate;
                else { dailyRate = parseFloat(formatEther(toBig(data[rateIdx]))); rateIdx++; }
                dataIdx += 4;
            });
            parsed[key] = { wallet, staked, reward, approved, dailyRate };
        });
        return parsed;
    }, [contractData]);

    const callStake = async (amount: number) => {
        if (!address || !selectedNft) return toast.error("Select NFT");
        try {
            await writeContractAsync({
                abi: abiNEWSTAKE,
                address: selectedNft.staking,
                functionName: "stake",
                args: [BigInt(selectedNft.ids[0]), BigInt(amount)],
            });
            toast.success("Staked!");
            refetch();
        } catch { toast.error("Stake failed"); }
    };

    const callUnstake = async (amount: number) => {
        if (!address || !selectedNft) return toast.error("Select NFT");
        const stakeAbi = selectedNft.isOld ? abiSTAKE : abiNEWSTAKE;
        try {
            await writeContractAsync({
                abi: stakeAbi,
                address: selectedNft.staking,
                functionName: "unstake",
                args: [BigInt(selectedNft.ids[0]), BigInt(amount)],
            });
            toast.success("Unstaked!");
            refetch();
        } catch { toast.error("Unstake failed"); }
    };

    const callClaim = async () => {
        if (!address || !selectedNft) return toast.error("Select NFT");
        const stakeAbi = selectedNft.isOld ? abiSTAKE : abiNEWSTAKE;
        try {
            for (const id of selectedNft.ids) {
                await writeContractAsync({ abi: stakeAbi, address: selectedNft.staking, functionName: "claimReward", args: [BigInt(id)] });
            }
            toast.success("Claimed!");
            refetch();
        } catch { toast.error("Claim failed"); }
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
                {nft.isOld && (
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        V1 END
                    </span>
                )}
                <img src={nft.image} alt={nft.name} className="w-full h-auto rounded-lg mb-2 object-cover" />
                <p className="text-sm font-semibold text-white truncate">{nft.name}</p>
                <p className="text-[10px] text-gray-400">Wallet: {data.wallet}</p> 
                <p className="text-[10px] text-purple-400">Staked: {data.staked}</p>
            </div>
        );
    };

    const renderActionPanel = () => {
        if (!isConnected || !selectedNft) return <p className="text-gray-400 text-center py-10">Connect wallet & select an NFT.</p>;

        const data = results[selectedCardId!];
        const rewardValid = data.reward > 0.0001;

        return (
            <div className="bg-gray-700 p-4 rounded-xl text-left border border-purple-800 shadow-inner">
                <h3 className="text-xl font-bold text-pink-400 mb-3 flex items-center gap-2 uppercase tracking-tighter">
                    <PiggyBank className="w-5 h-5"/> {selectedNft.name} Staking
                </h3>

                {selectedNft.isOld && (
                    <div className="bg-red-900/40 border border-red-500 p-3 rounded-lg mb-4 flex items-start gap-2 shadow-md">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>
                        <p className="text-[11px] text-red-100 font-medium">
                            STAKING V1 ENDED. Unstake your NFT and Upgrade to Lv 1 to continue earning rewards in Staking V2.
                        </p>
                    </div>
                )}

                <div className="text-sm bg-gray-800 p-3 rounded-lg mb-4">
                    <p className="text-gray-400">Daily Reward per NFT: <span className="font-bold text-yellow-400 ml-1">{selectedNft.isOld ? "0.00" : data.dailyRate.toFixed(2)} $MON</span></p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    <div className="bg-gray-800 p-3 rounded-xl"><p className="text-gray-400 text-xs">Wallet</p><p className="text-white text-lg font-bold">{data.wallet}</p></div>
                    <div className="bg-gray-800 p-3 rounded-xl"><p className="text-gray-400 text-xs">Staked</p><p className="text-purple-400 text-lg font-bold">{data.staked}</p></div>
                    <div className="bg-gray-800 p-3 rounded-xl"><p className="text-gray-400 text-xs">Reward</p><p className="text-yellow-400 text-lg font-bold">{data.reward.toFixed(4)}</p></div>
                </div>

                <div className="space-y-3">
                    {/* Only show Claim for New NFT */}
                    {!selectedNft.isOld && (
                        <>
                            <button onClick={callClaim} disabled={!rewardValid} className={`w-full py-2 rounded-xl font-bold uppercase transition ${rewardValid ? 'bg-green-500 hover:bg-green-600 shadow-md' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}>
                                Claim Rewards
                            </button>
                            <div className="flex gap-2">
                                <input type="number" min={1} value={stakeAmount} onChange={(e) => setStakeAmount(Math.max(1, parseInt(e.target.value || "1")))} className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center font-bold" />
                                <button onClick={() => callStake(stakeAmount)} disabled={data.wallet === 0} className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-xl font-bold uppercase disabled:opacity-50 shadow-md">Stake</button>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2">
                        <input type="number" min={1} value={unstakeAmount} onChange={(e) => setUnstakeAmount(Math.max(1, parseInt(e.target.value || "1")))} className="w-20 bg-gray-800 text-white p-2 rounded-lg text-center font-bold" />
                        <button onClick={() => callUnstake(unstakeAmount)} disabled={data.staked === 0} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-xl font-bold uppercase disabled:opacity-50 shadow-md">Unstake</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 text-white">
            <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-2xl w-full text-center mx-auto">
                <h1 className="text-4xl font-black text-pink-600 mb-6 uppercase italic tracking-tighter">Staking Center</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {renderNftCard('old1')}
                    {renderNftCard('old2')}
                    {renderNftCard('new1')}
                    {renderNftCard('new2')}
                </div>
                <div className="w-full">{renderActionPanel()}</div>
            </div>
        </div>
    );
}