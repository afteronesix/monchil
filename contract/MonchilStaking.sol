// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MonchilStaking is Ownable, ERC1155Holder, ReentrancyGuard {

    IERC1155 public immutable monchilNFT;
    uint256 public rewardRatePerDay;
    uint256 private constant SECONDS_PER_DAY = 24 hours;

    struct StakeInfo {
        uint256 amount;
        uint256 lastClaimTime;
    }

    mapping(address => mapping(uint256 => StakeInfo)) public userStakes;
    mapping(uint256 => bool) public isTokenStakable;

    event Staked(address indexed user, uint256 indexed tokenId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 amount);
    event RewardPaid(address indexed user, uint256 indexed tokenId, uint256 rewardAmount);
    event RewardPoolFunded(address indexed funder, uint256 amount);

    constructor(address _monchilNFTAddress, address initialOwner) Ownable(initialOwner) {
        monchilNFT = IERC1155(_monchilNFTAddress);
        rewardRatePerDay = 0.05 ether; 
        
        isTokenStakable[1] = true;
        isTokenStakable[2] = true;
    }

    function stake(uint256 tokenId, uint256 amount) public nonReentrant {
        require(isTokenStakable[tokenId], "Staking: This token ID is not stakable");
        require(amount > 0, "Staking: Amount must be greater than 0");

        StakeInfo storage stakeInfo = userStakes[msg.sender][tokenId];

        if (stakeInfo.amount > 0) {
            _claimPendingReward(msg.sender, tokenId);
        }
        
        stakeInfo.amount += amount;
        stakeInfo.lastClaimTime = block.timestamp;

        monchilNFT.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        emit Staked(msg.sender, tokenId, amount);
    }

    function unstake(uint256 tokenId, uint256 amount) public nonReentrant {
        require(isTokenStakable[tokenId], "Staking: Invalid token ID");
        require(amount > 0, "Staking: Amount must be greater than 0");

        StakeInfo storage stakeInfo = userStakes[msg.sender][tokenId];
        require(stakeInfo.amount >= amount, "Staking: Unstake amount exceeds staked balance");

        _claimPendingReward(msg.sender, tokenId);
        
        stakeInfo.amount -= amount;
        stakeInfo.lastClaimTime = block.timestamp;

        monchilNFT.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");

        emit Unstaked(msg.sender, tokenId, amount);
    }

    function claimReward(uint256 tokenId) public nonReentrant {
        require(isTokenStakable[tokenId], "Staking: Invalid token ID");
        _claimPendingReward(msg.sender, tokenId);
    }

    function _claimPendingReward(address user, uint256 tokenId) private {
        StakeInfo storage stakeInfo = userStakes[user][tokenId];
        uint256 pendingRewards = calculatePendingRewards(user, tokenId);

        if (pendingRewards > 0) {
            stakeInfo.lastClaimTime = block.timestamp;
            require(address(this).balance >= pendingRewards, "Staking: Reward pool empty, contact owner");

            (bool success, ) = user.call{value: pendingRewards}("");
            require(success, "Staking: Failed to send reward ETH");

            emit RewardPaid(user, tokenId, pendingRewards);
        }
    }

    function calculatePendingRewards(address user, uint256 tokenId) public view returns (uint256) {
        StakeInfo storage stakeInfo = userStakes[user][tokenId];
        if (stakeInfo.amount == 0) {
            return 0;
        }
        uint256 timeElapsed = block.timestamp - stakeInfo.lastClaimTime;
        return (timeElapsed * rewardRatePerDay * stakeInfo.amount) / SECONDS_PER_DAY;
    }

    function depositRewards() public payable onlyOwner {
        require(msg.value > 0, "Owner: Must deposit more than 0 ETH");
        emit RewardPoolFunded(msg.sender, msg.value);
    }

    function withdrawMON() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Owner: No ETH to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Owner: Failed to withdraw ETH");
    }

    function setTokenStakable(uint256 tokenId, bool stakable) public onlyOwner {
        isTokenStakable[tokenId] = stakable;
    }

    function setDailyRewardRate(uint256 _dailyRateInWei) public onlyOwner {
        rewardRatePerDay = _dailyRateInWei;
    }
}