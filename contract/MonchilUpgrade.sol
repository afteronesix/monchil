// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IMonchilID {
    function mint(address to, uint256 tokenId, uint256 amount) external;
    function burn(address from, uint256 tokenId, uint256 amount) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract MonchilUpgrade is Ownable {
    address public constant OLD_NFT_CONTRACT = 0xc84932efcBeEdbcf5B25F41461DE3F2b7DB8f5Eb;
    
    IMonchilID public monchilID;
    address public treasuryAddress;

    mapping(uint256 => uint256) public upgradeFees;
    uint256 public directMintFeeLevel1;
    uint256 public constant MAX_LEVEL = 5;

    constructor(
        address initialOwner,
        address _monchilIDAddress,
        address _treasuryAddress
    ) Ownable(initialOwner) {
        monchilID = IMonchilID(_monchilIDAddress);
        treasuryAddress = _treasuryAddress;

        upgradeFees[1] = 25 ether;
        upgradeFees[2] = 125 ether;
        upgradeFees[3] = 250 ether; 
        upgradeFees[4] = 1000 ether; 
        upgradeFees[5] = 1250 ether; 
        
        directMintFeeLevel1 = 30 ether;
    }

    function mintLevel1(uint256 amount) public payable {
        require(amount > 0, "Mint: Amount must be > 0");
        uint256 totalFee = directMintFeeLevel1 * amount;
        _handlePayment(totalFee);
        monchilID.mint(msg.sender, 1, amount);
    }

    function upgradeToLevel1() public payable {
        _handlePayment(upgradeFees[1]);

        IERC1155 oldNft = IERC1155(OLD_NFT_CONTRACT);
        address sender = msg.sender;

        uint256 happyId = _findAvailableId(sender, true);
        require(happyId != 0, "Upgrade: No Happy NFT (Odd ID) found");
        
        uint256 sadId = _findAvailableId(sender, false);
        require(sadId != 0, "Upgrade: No Sad NFT (Even ID) found");

        oldNft.safeTransferFrom(sender, treasuryAddress, happyId, 1, "");
        oldNft.safeTransferFrom(sender, treasuryAddress, sadId, 1, "");

        monchilID.mint(sender, 1, 1);
    }

    function upgradeLevel(uint256 currentLevel) public payable {
        uint256 levelToMint = currentLevel + 1;
        require(currentLevel >= 1 && currentLevel < MAX_LEVEL, "Upgrade: Invalid level");
        
        _handlePayment(upgradeFees[levelToMint]);

        address sender = msg.sender;
        require(monchilID.balanceOf(sender, currentLevel) >= 2, "Upgrade: Need 2x Current Level NFTs");
        
        monchilID.burn(sender, currentLevel, 2);
        monchilID.mint(sender, levelToMint, 1);
    }

    function _findAvailableId(address _user, bool _isHappy) internal view returns (uint256) {
        IERC1155 oldNft = IERC1155(OLD_NFT_CONTRACT);
        if (_isHappy) {
            uint256[5] memory happyIds = [uint256(1), 3, 5, 7, 9];
            for (uint i = 0; i < 5; i++) {
                if (oldNft.balanceOf(_user, happyIds[i]) > 0) return happyIds[i];
            }
        } else {
            uint256[5] memory sadIds = [uint256(2), 4, 6, 8, 10];
            for (uint i = 0; i < 5; i++) {
                if (oldNft.balanceOf(_user, sadIds[i]) > 0) return sadIds[i];
            }
        }
        return 0;
    }

    function _handlePayment(uint256 requiredFee) internal {
        require(msg.value == requiredFee, "Payment: Incorrect fee");
        (bool success, ) = payable(treasuryAddress).call{value: msg.value}("");
        require(success, "Payment: Failed");
    }

    function setUpgradeFee(uint256 levelToMint, uint256 feeAmount) public onlyOwner {
        require(levelToMint >= 1 && levelToMint <= MAX_LEVEL, "Level: Invalid");
        upgradeFees[levelToMint] = feeAmount;
    }

    function setDirectMintFeeLevel1(uint256 feeAmount) public onlyOwner {
        directMintFeeLevel1 = feeAmount;
    }

    function setTreasuryAddress(address _newTreasury) public onlyOwner {
        treasuryAddress = _newTreasury;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
