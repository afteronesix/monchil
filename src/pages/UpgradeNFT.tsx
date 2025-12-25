import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { toast } from "react-toastify";
import type { Abi } from "viem";
import { Zap, CornerUpRight, Clock, Coins } from "lucide-react";

import { abi as oldNftAbi } from "../hooks/abi/abiNFT";
import { monchilIdAbi } from "../hooks/abi/AbiMonchilID";
import { upgradeAbi } from "../hooks/abi/AbiUpgrade";

const OLD_NFT_CONTRACT: `0x${string}` = "0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb";
const NEW_NFT_CONTRACT: `0x${string}` = "0x5f052CC161d117154CA4FED968EA037bF9cE4F02";
const UPGRADE_CONTRACT: `0x${string}` = "0xfb7EA1fdb323b7e9c97fe6688EeF9A70E910571b";

const NFT_CONFIG = {
    old: { level: 0, name: "Monchil Lv 0", image: "/old.png", reward: "0.02" },
    new1: { level: 1, name: "Monchil Lv 1", image: "/1.png", reward: "0.40" },
    new2: { level: 2, name: "Monchil Lv 2", image: "/2.png", reward: "4" },
    new3: { level: 3, name: "Monchil Lv 3", image: "/3.png", reward: "10" },
};

export function UpgradeNFT() {
    const { address, isConnected } = useAccount();
    const { writeContractAsync, isPending: isTxPending } = useWriteContract();
    const [selectedCardId, setSelectedCardId] = useState<'old' | 'new1' | 'new2' | 'new3' | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    const userAddress = address || "0x0000000000000000000000000000000000000000";

    const contracts = useMemo(() => [
        ...[1n, 3n, 5n, 7n, 9n].map(id => ({ abi: oldNftAbi, address: OLD_NFT_CONTRACT, functionName: "balanceOf", args: [userAddress, id] })),
        ...[2n, 4n, 6n, 8n, 10n].map(id => ({ abi: oldNftAbi, address: OLD_NFT_CONTRACT, functionName: "balanceOf", args: [userAddress, id] })),
        { abi: monchilIdAbi, address: NEW_NFT_CONTRACT, functionName: "balanceOf", args: [userAddress, 1n] },
        { abi: monchilIdAbi, address: NEW_NFT_CONTRACT, functionName: "balanceOf", args: [userAddress, 2n] },
        { abi: monchilIdAbi, address: NEW_NFT_CONTRACT, functionName: "balanceOf", args: [userAddress, 3n] },
        { abi: upgradeAbi, address: UPGRADE_CONTRACT, functionName: "upgradeFees", args: [1n] },
        { abi: upgradeAbi, address: UPGRADE_CONTRACT, functionName: "upgradeFees", args: [2n] },
        { abi: upgradeAbi, address: UPGRADE_CONTRACT, functionName: "upgradeFees", args: [3n] },
        { abi: oldNftAbi, address: OLD_NFT_CONTRACT, functionName: "isApprovedForAll", args: [userAddress, UPGRADE_CONTRACT] },
        { abi: monchilIdAbi, address: NEW_NFT_CONTRACT, functionName: "isApprovedForAll", args: [userAddress, UPGRADE_CONTRACT] },
    ], [userAddress]);

    const { data: contractData, refetch } = useReadContracts({
        contracts: contracts as any,
        query: { enabled: isConnected, staleTime: 5000 },
    });

    const dataArray = contractData?.map(d => (d.status === "success" ? (d.result || 0n) : 0n)) ?? [];

    const balances = useMemo(() => {
        const happyTotal = dataArray.slice(0, 5).reduce((a, b) => (a as bigint) + (b as bigint), 0n);
        const sadTotal = dataArray.slice(5, 10).reduce((a, b) => (a as bigint) + (b as bigint), 0n);
        return {
            happy: happyTotal as bigint,
            sad: sadTotal as bigint,
            totalOld: (happyTotal as bigint) + (sadTotal as bigint),
            new1: dataArray[10] as bigint,
            new2: dataArray[11] as bigint,
            new3: dataArray[12] as bigint,
        };
    }, [dataArray]);

    const fees = { 1: dataArray[13] as bigint, 2: dataArray[14] as bigint, 3: dataArray[15] as bigint };
    const isOldApproved = dataArray[16] as boolean | undefined;
    const isNewApproved = dataArray[17] as boolean | undefined;

    const currentLevelId = selectedCardId === 'old' ? 0 : selectedCardId === 'new1' ? 1 : selectedCardId === 'new2' ? 2 : 3;
    const nextLevel = currentLevelId + 1;
    const isLevel1Upgrade = currentLevelId === 0;
    const requiredFee = fees[nextLevel as keyof typeof fees] || 0n;
    
    const needsApproval = isLevel1Upgrade ? !isOldApproved : !isNewApproved;
    const isReady = isLevel1Upgrade 
        ? (balances.happy >= 1n && balances.sad >= 1n) 
        : currentLevelId === 1 ? balances.new1 >= 2n : currentLevelId === 2 ? balances.new2 >= 2n : false;

    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(() => refetch(), 15000);
            return () => clearInterval(interval);
        }
    }, [isConnected, refetch]);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await writeContractAsync({
                address: isLevel1Upgrade ? OLD_NFT_CONTRACT : NEW_NFT_CONTRACT,
                abi: (isLevel1Upgrade ? oldNftAbi : monchilIdAbi) as Abi,
                functionName: "setApprovalForAll",
                args: [UPGRADE_CONTRACT, true],
            });
            toast.success("Approval sent");
        } catch { toast.error("Approval Failed"); }
        finally { setIsApproving(false); }
    };

    const handleUpgrade = async () => {
        try {
            await writeContractAsync({
                address: UPGRADE_CONTRACT,
                abi: upgradeAbi as Abi,
                functionName: isLevel1Upgrade ? "upgradeToLevel1" : "upgradeLevel",
                args: isLevel1Upgrade ? [] : [BigInt(currentLevelId)],
                value: requiredFee,
            });
            toast.success("Upgrade initiated");
        } catch { toast.error("Upgrade Failed"); }
    };

    const renderNftCard = (id: 'old' | 'new1' | 'new2' | 'new3', config: any, balance: bigint) => (
        <div 
            onClick={() => setSelectedCardId(id)}
            className={`relative bg-gray-800 rounded-xl p-3 border transition-all cursor-pointer ${selectedCardId === id ? 'border-4 border-pink-500 scale-105' : 'border-gray-700 hover:border-purple-500'}`}
        >
            <span className="absolute top-0 right-0 bg-purple-600 text-[10px] px-2 py-1 rounded-bl-lg font-bold">x{Number(balance)}</span>
            <img src={config.image} className="w-full h-auto rounded-lg mb-2" />
            <p className="text-xs font-bold text-white uppercase">{config.name}</p>
            <p className="text-[9px] text-yellow-500 font-bold">{config.reward} $MON/DAY</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center min-h-screen p-4 text-white">
            <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-2xl w-full text-center mx-auto">
                <h1 className="text-4xl font-black text-pink-600 mb-6 uppercase italic tracking-tighter">Upgrade Center</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {renderNftCard('old', NFT_CONFIG.old, balances.totalOld)}
                    {renderNftCard('new1', NFT_CONFIG.new1, balances.new1)}
                    {renderNftCard('new2', NFT_CONFIG.new2, balances.new2)}
                    {renderNftCard('new3', NFT_CONFIG.new3, balances.new3)}
                </div>

                <div className="w-full">
                    {selectedCardId && selectedCardId !== 'new3' ? (
                        <div className="bg-gray-800 p-5 rounded-xl text-left border border-purple-500/30 shadow-inner">
                            <h3 className="text-xl font-black text-pink-400 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5"/> LV {currentLevelId} <CornerUpRight className="w-4 h-4"/> LV {nextLevel}
                            </h3>
                            <div className="space-y-3 text-sm mb-6 bg-gray-900/50 p-4 rounded-lg">
                                <div className="border-b border-gray-700 pb-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-2">Required Materials:</p>
                                    {isLevel1Upgrade ? (
                                        <>
                                            <p className="flex justify-between"><span>Happy Mon (Odd ID):</span> <span className={balances.happy >= 1n ? "text-green-400 font-bold" : "text-white"}>{Number(balances.happy)} / 1</span></p>
                                            <p className="flex justify-between"><span>Sad Mon (Even ID):</span> <span className={balances.sad >= 1n ? "text-green-400 font-bold" : "text-white"}>{Number(balances.sad)} / 1</span></p>
                                        </>
                                    ) : (
                                        <p className="flex justify-between"><span>Lv {currentLevelId} NFT:</span> <span className={(currentLevelId === 1 ? balances.new1 : balances.new2) >= 2n ? "text-green-400 font-bold" : "text-white"}>{Number(currentLevelId === 1 ? balances.new1 : balances.new2)} / 2</span></p>
                                    )}
                                </div>
                                <div className="border-b border-gray-700 pb-2">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Staking Bonus:</p>
                                    <p className="flex justify-between items-center font-bold">
                                        <span className="text-gray-400 line-through text-xs">{NFT_CONFIG[selectedCardId].reward} $MON/Day</span>
                                        <span className="text-green-400 flex items-center gap-1 text-lg">
                                            <Coins className="w-4 h-4"/> {NFT_CONFIG[`new${nextLevel}` as keyof typeof NFT_CONFIG].reward} $MON/Day
                                        </span>
                                    </p>
                                </div>
                                <p className="flex justify-between pt-2"><span>Upgrade Fee:</span> <span className="text-yellow-400 font-black text-lg">{Number(requiredFee)/1e18} $MON</span></p>
                                <p className="flex justify-between"><span>Status:</span> <span className={isReady ? "text-green-400 font-black uppercase" : "text-red-400 font-black uppercase"}>{isReady ? "READY" : "LOCKED"}</span></p>
                            </div>
                            {needsApproval ? (
                                <button onClick={handleApprove} disabled={isApproving} className="w-full bg-yellow-500 py-3 rounded-xl text-black font-black uppercase hover:bg-yellow-400 transition disabled:opacity-50">
                                    {isApproving ? "Approving..." : `Approve ${isLevel1Upgrade ? "Old" : "New"} NFT`}
                                </button>
                            ) : (
                                <button onClick={handleUpgrade} disabled={!isReady || isTxPending} className={`w-full py-4 rounded-xl font-black uppercase transition shadow-lg ${isReady ? 'bg-purple-600 hover:bg-pink-600 active:scale-95' : 'bg-gray-700 cursor-not-allowed text-gray-500'}`}>
                                    {isTxPending ? "Processing..." : "Confirm Upgrade"}
                                </button>
                            )}
                        </div>
                    ) : selectedCardId === 'new3' ? (
                        <div className="bg-gray-800 p-8 rounded-xl border border-yellow-500/30 text-center">
                             <h3 className="text-xl font-black text-yellow-400 flex items-center justify-center gap-2 uppercase tracking-widest"><Clock/> Max Level Reached</h3>
                             <p className="text-gray-400 text-sm mt-2 font-bold">Current Earning: {NFT_CONFIG.new3.reward} $MON/Day</p>
                        </div>
                    ) : <p className="text-gray-500 italic">Select an NFT to see rewards & upgrade cost</p>}
                </div>
            </div>
        </div>
    );
}