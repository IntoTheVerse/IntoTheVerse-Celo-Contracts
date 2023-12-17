// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TreeContract is Ownable, ERC721A {
    using Strings for uint256;

    struct TreeAttributes {
        uint256 level;
        uint256 lastWatered;
    }

    uint256 public cost = 0 ether; // Mint price.
    uint256 public constant maxLevel = 10; // Maximum level.
    uint256 public constant decayRate = 1; // Decaying by 1 level for simplicity.
    uint256 public constant maxSupply = 10000;
    uint256 public constant decayPeriod = 1 weeks; // Decay period of 1 week.

    string public _baseTokenURI; // Base url for metadata.

    address public greenDonationContract;
    mapping(uint => TreeAttributes) public trees;

    constructor(
        string memory baseURI
    ) Ownable(msg.sender) ERC721A("Tree Contract", "TCT") {
        _baseTokenURI = baseURI;
    }

    modifier onlyGreenDonationContract() {
        require(
            msg.sender == greenDonationContract,
            "Only green donation contract can call this function"
        );
        _;
    }

    function setGreenDonationContract(
        address _greenDonationContract
    ) external onlyOwner {
        greenDonationContract = _greenDonationContract;
    }

    /**
     * @dev Returns the first token id.
     */
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    /**
     * @dev change cost
     * @param _cost cost of the token
     */
    function setCost(uint256 _cost) external onlyOwner {
        cost = _cost;
    }

    /**
     * @dev _baseURI overides the Openzeppelin's ERC721 implementation which by default
     * returned an empty string for the baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev setBaseURI
     * @param _uri base url for metadata
     */
    function setBaseURI(string memory _uri) external onlyOwner {
        _baseTokenURI = _uri;
    }

    function mint(uint256 _quantity) external payable {
        uint256 supply = _totalMinted();
        require(
            _numberMinted(msg.sender) + _quantity <= 10,
            "Exceed max mintable amount"
        );
        require(supply + _quantity <= maxSupply, "Exceed maximum supply");
        require(msg.value == cost * _quantity, "Incorrect value sent");
        _mint(msg.sender, _quantity);
    }

    // New function to water a tree
    function waterTree(uint256 _tokenId) external onlyGreenDonationContract {
        require(_exists(_tokenId), "Tree does not exist");

        // Calculate decay
        uint256 decayedLevels = _calculateDecay(_tokenId);

        // Update tree's level after decay (if any)
        if (decayedLevels > 0) {
            if (trees[_tokenId].level > decayedLevels) {
                trees[_tokenId].level -= decayedLevels;
            } else {
                trees[_tokenId].level = 1; // Setting a minimum level for simplicity
            }
        }

        // Update the lastWatered timestamp
        trees[_tokenId].lastWatered = block.timestamp;
        trees[_tokenId].level++;
    }

    function _calculateDecay(uint256 _tokenId) internal view returns (uint256) {
        uint256 elapsedTime = block.timestamp - trees[_tokenId].lastWatered;

        // Calculate the number of decay periods that have passed
        uint256 numberOfPeriods = elapsedTime / decayPeriod;

        return numberOfPeriods * decayRate;
    }

    /**
     * @dev Get token URI
     * @param tokenId ID of the token to retrieve
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override(ERC721A) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        string memory currentBaseURI = _baseURI();

        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        Strings.toString(tokenId),
                        ".json"
                    )
                )
                : "";
    }

    /**
     * @dev withdraw ETH from contract
     */
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    //return last watered timestamp
    function getLastWatered(uint256 _tokenId) external view returns (uint256) {
        return trees[_tokenId].lastWatered;
    }

    function downgradeTree(
        uint256 _tokenId
    ) external onlyGreenDonationContract {
        require(_exists(_tokenId), "Tree does not exist");
        if (trees[_tokenId].level > 1) trees[_tokenId].level--;
    }
}
