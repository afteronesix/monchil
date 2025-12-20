import { useState, useMemo } from "react";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import { abiReferral } from "../hooks/abi/abiReferral";
import { sdk } from "@farcaster/miniapp-sdk";
import { toast } from "react-toastify";
import { formatEther } from "viem";
import { Users, Gift, Copy, Share2 } from "lucide-react";

const REF_CONTRACT: `0x${string}` = "0x69338a38Cce1249391f3b49Fda173E132483E0fa";

export function RefPage() {
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [refInput, setRefInput] = useState("");

    const addressOrDefault = address ?? "0x4e31fd03860b84af315a2caa10defc3c77091ca9";

    const { data, refetch } = useReadContracts({
        contracts: [
            { abi: abiReferral, address: REF_CONTRACT, functionName: "getUserData", args: [addressOrDefault] },
            { abi: abiReferral, address: REF_CONTRACT, functionName: "rewardPerReferral" }
        ],
        query: { enabled: isConnected, refetchInterval: 5000 }
    });

    const userData = useMemo(() => {
        if (!data?.[0]?.result) return { myCode: "", refCode: "", count: 0n, claimed: 0n };
        const [myCode, refCode, count, claimed] = data[0].result as [string, string, bigint, bigint];
        return { myCode, refCode, count, claimed };
    }, [data]);

    const rewardRate = useMemo(() => (data?.[1]?.result ? parseFloat(formatEther(data[1].result as bigint)) : 2), [data]);

    const totalEarned = Number(userData.count) * rewardRate;
    const pendingClaim = (Number(userData.count) - Number(userData.claimed)) * rewardRate;
    const canClaim = (Number(userData.count) - Number(userData.claimed)) >= 5;

    const handleRegister = async () => {
        if (!refInput) return toast.error("Please enter a referral code");
        try {
            await writeContractAsync({
                abi: abiReferral,
                address: REF_CONTRACT,
                functionName: "register",
                args: [refInput]
            });
            toast.success("Successfully registered!");
            refetch();
        } catch {
            toast.error("Registration failed");
        }
    };

    const handleClaim = async () => {
        try {
            await writeContractAsync({
                abi: abiReferral,
                address: REF_CONTRACT,
                functionName: "claimReward"
            });
            toast.success("Rewards successfully claimed!");
            refetch();
        } catch {
            toast.error("Claiming failed");
        }
    };

    const handleShare = () => {
        if (!userData.myCode) return;
        sdk.actions.composeCast({
            text: `Join Monchil and earn rewards! Use my referral code: ${userData.myCode} ✨\n\nBuild your collection and earn $MON!`,
            embeds: ["https://monchil.vercel.app"]
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Code copied to clipboard!");
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4">
            <div className="bg-gray-900 border-purple-700 rounded-2xl shadow-lg p-6 max-w-2xl w-full text-center mx-auto">
                <h1 className="text-4xl font-bold text-pink-600 mb-2">Refer & Earn</h1>
                <p className="text-gray-400 mb-8 italic">Invite at least 5 friends to unlock your rewards!</p>

                {!userData.myCode ? (
                    <div className="bg-gray-800 p-6 rounded-xl mb-6 border border-purple-500/30">
                        <p className="text-white mb-4 font-bold text-lg">Enter Referrer Code</p>
                        <input 
                            value={refInput}
                            onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                            placeholder="EXAMPLE123"
                            className="w-full bg-gray-900 text-white p-4 rounded-lg text-center mb-4 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <button onClick={handleRegister} className="w-full bg-purple-600 py-4 rounded-xl font-bold hover:bg-pink-600 transition-all shadow-lg">
                            Register & Get My Code
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-800 p-5 rounded-xl border border-purple-500">
                                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Your Unique Code</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-3xl font-black text-white">{userData.myCode}</span>
                                    <button onClick={() => copyToClipboard(userData.myCode)} className="p-2 hover:bg-gray-700 rounded-full transition">
                                        <Copy className="w-5 h-5 text-purple-400"/>
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-800 p-5 rounded-xl border border-purple-500">
                                <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Friends Invited</p>
                                <div className="flex items-center justify-center gap-3">
                                    <Users className="w-6 h-6 text-pink-500"/>
                                    <span className="text-3xl font-black text-white">{Number(userData.count)}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition shadow-lg"
                        >
                            <Share2 className="w-5 h-5"/> Share to Farcaster
                        </button>
                    </div>
                )}

                <div className="bg-purple-900/30 p-6 rounded-xl border border-pink-500/50 mb-6 shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-left">
                            <p className="text-gray-300 text-sm font-medium">Accumulated Rewards</p>
                            <p className="text-4xl font-black text-yellow-400">{totalEarned.toFixed(2)} $MON</p>
                        </div>
                        <Gift className="w-12 h-12 text-yellow-400 opacity-40"/>
                    </div>
                    
                    <div className="bg-gray-900/60 p-4 rounded-lg text-md text-gray-200 mb-6 flex justify-between items-center">
                        <span>Available for Claim:</span>
                        <span className="text-green-400 font-black text-lg">{pendingClaim.toFixed(2)} $MON</span>
                    </div>

                    <button 
                        onClick={handleClaim}
                        disabled={!canClaim}
                        className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl ${
                            canClaim 
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400 transform hover:-translate-y-1' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {canClaim 
                            ? 'CLAIM NOW' 
                            : `NEED ${5 - (Number(userData.count) % 5 || 5)} MORE REFERRALS`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}