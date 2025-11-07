// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Monchil is ERC1155, Ownable {
    using Strings for uint256; 

    string public constant name = "MONCHIL";
    string public constant symbol = "MCL";

    string private constant BASE_URI = "https://gateway.lighthouse.storage/ipfs/bafybeiepr4zvwxo5zbrzzbk7ih257sfiuxbrr2yjiwxtuap3c5kmhd5fsq/";

    uint256 public constant MINT_PRICE = 0.5 ether;

    uint256 public constant MAX_SUPPLY_PER_ID = 5_000_000;

    mapping(uint256 => uint256) private _totalSupply;

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    function uri(uint256 tokenId) public pure override returns (string memory) {
        require(tokenId >= 1 && tokenId <= 3, "Monchil: Invalid token ID");
        return string(abi.encodePacked(BASE_URI, tokenId.toString(), ".json"));
    }

    function mint(uint256 tokenId, uint256 amount) public payable {
        require(tokenId >= 1 && tokenId <= 3, "Monchil: Invalid token ID");
        require(amount > 0, "Monchil: Amount must be greater than zero");
        require(_totalSupply[tokenId] + amount <= MAX_SUPPLY_PER_ID, "Monchil: Exceeds max supply for this ID");
        require(msg.value == MINT_PRICE * amount, "Monchil: Incorrect Ether value sent");

        _totalSupply[tokenId] += amount;

        _mint(msg.sender, tokenId, amount, "");

        (bool success, ) = owner().call{value: msg.value}("");
        require(success, "Monchil: Failed to transfer funds");
    }

    function devMint(address to, uint256 tokenId, uint256 amount) public onlyOwner {
        require(tokenId >= 1 && tokenId <= 3, "Monchil: Invalid token ID");
        require(amount > 0, "Monchil: Amount must be greater than zero");
        require(_totalSupply[tokenId] + amount <= MAX_SUPPLY_PER_ID, "Monchil: Exceeds max supply for this ID");
        
        _totalSupply[tokenId] += amount;

        _mint(to, tokenId, amount, "");
    }

    function totalSupply(uint256 tokenId) public view returns (uint256) {
        return _totalSupply[tokenId];
    }
}