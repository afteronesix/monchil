
export const abiReferral = [
    {
        "inputs": [
            { "internalType": "address", "name": "initialOwner", "type": "address" },
            { "internalType": "string", "name": "devCode", "type": "string" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }],
        "name": "generateCode",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_refCode", "type": "string" }],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonReentrant",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimReward",
        "outputs": [],
        "stateMutability": "nonReentrant",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }],
        "name": "getUserData",
        "outputs": [
            { "internalType": "string", "name": "myCode", "type": "string" },
            { "internalType": "string", "name": "referrerCode", "type": "string" },
            { "internalType": "uint256", "name": "inviteCount", "type": "uint256" },
            { "internalType": "uint256", "name": "rewardsClaimed", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "rewardPerReferral",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;