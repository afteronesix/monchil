// hooks/AbiUpgrade.ts


export const upgradeAbi = [
 
  {
    "inputs": [],
    "name": "upgradeToLevel1",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
    
 
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "currentLevel",
        "type": "uint256"
      }
    ],
    "name": "upgradeLevel",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
    
  
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "upgradeFees",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

] as const ;