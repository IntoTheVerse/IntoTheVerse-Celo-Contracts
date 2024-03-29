// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import {ITC02} from "./interfaces/ITC02.sol";
import {RetirementCertificateEscrow} from "./RetirementCertificateEscrow.sol";
import {IRetirementCertificates} from "./interfaces/IRetirementCertificates.sol";

contract TreeContract is Ownable, ERC721A {
    using Strings for uint256;

    struct TreeAttributes {
        uint256 level;
        uint256 lastWatered;
    }

    uint256 public cost = 0 ether; // Mint price.
    uint256 public constant decayRate = 1; // Decaying by 1 level for simplicity.
    uint256 public constant maxSupply = 10000;
    uint256 public constant decayPeriod = 1 weeks; // Decay period of 1 week.

    uint256 public redemptionRate = 10; // Percent of rewards to offset.

    string public _baseTokenURI; // Base url for metadata.

    address public greenDonationContract;
    mapping(uint => TreeAttributes) public trees;

    IUniswapV2Router02 public swapRouter;
    ITC02 public tc02;
    address public wrappedNativeToken;
    IRetirementCertificates public retirementCertificates;
    RetirementCertificateEscrow public retirementCertificateEscrow;

    constructor(
        string memory baseURI,
        address _tc02,
        address _wrappedNativeToken,
        address _retirementCertificates,
        address _swapRouter
    ) Ownable(msg.sender) ERC721A("Tree Contract", "TCT") {
        _baseTokenURI = baseURI;
        tc02 = ITC02(_tc02);
        wrappedNativeToken = _wrappedNativeToken;
        retirementCertificates = IRetirementCertificates(
            _retirementCertificates
        );
        swapRouter = IUniswapV2Router02(_swapRouter);
        IERC20(_wrappedNativeToken).approve(
            address(_swapRouter),
            type(uint256).max
        );
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

    function setRedemptionRate(uint256 _rate) external onlyOwner {
        redemptionRate = _rate;
    }

    function setSwapRouter(address router) external onlyOwner {
        swapRouter = IUniswapV2Router02(router);
    }

    function setRetirementCertificateEscrow(
        address _retirementCertificateEscrow
    ) external onlyOwner {
        retirementCertificateEscrow = RetirementCertificateEscrow(
            _retirementCertificateEscrow
        );
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

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        // Only retirement certificates can transfer NFT to this contract.
        require(
            msg.sender == address(retirementCertificates),
            "Not retirement certificate"
        );
        return this.onERC721Received.selector;
    }

    function _swapForTC02(uint256 amountToSwap) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = address(wrappedNativeToken);
        path[1] = address(tc02);
        uint256[] memory amountSwapped = swapRouter.swapExactTokensForTokens(
            amountToSwap,
            0, // TOOD: use proper method to fetch amount for TC02 to avoid slippage.
            path,
            address(this),
            block.timestamp
        );
        return amountSwapped[amountSwapped.length - 1];
    }

    function _retireTC02Tokens(
        uint256 amountToRetire
    ) internal returns (uint256[] memory) {
        uint256[] memory retirementEventIds = new uint256[](1);
        retirementEventIds[0] = tc02.retire(amountToRetire);
        return retirementEventIds;
    }

    function mint(
        uint256 _quantity,
        string calldata beneficiaryString,
        string calldata retirementMessage
    ) external payable {
        uint256 supply = _totalMinted();
        require(
            _numberMinted(msg.sender) + _quantity <= 10,
            "Exceed max mintable amount"
        );
        require(supply + _quantity <= maxSupply, "Exceed maximum supply");
        require(msg.value == cost * _quantity, "Incorrect value sent");
        uint256 _nextTokenId = _nextTokenId();
        _mint(msg.sender, _quantity);

        uint256 retirementCertificateTokenId = retirementCertificates
            .mintCertificate(
                address(this), // Contract will get the certificate.
                "Into The Verse Tree User",
                msg.sender, // But, msg.sender will be the beneficiary.
                beneficiaryString,
                retirementMessage,
                _retireTC02Tokens(
                    _swapForTC02((msg.value * redemptionRate) / 100)
                )
            );

        ERC721Upgradeable(address(retirementCertificates)).approve(
            address(retirementCertificateEscrow),
            retirementCertificateTokenId
        );

        retirementCertificateEscrow.registerCertificateForClaim(
            _nextTokenId,
            retirementCertificateTokenId
        );
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
