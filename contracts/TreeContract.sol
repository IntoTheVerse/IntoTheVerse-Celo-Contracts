// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import {ITC02} from "./interfaces/ITC02.sol";
import {GreenDonation} from "./GreenDonation.sol";
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

    function _swapForTC02(
        uint256 amountToSwap,
        uint256 minAmountOut,
        uint256 deadline
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = address(wrappedNativeToken);
        path[1] = address(tc02);
        uint256[] memory amountSwapped = swapRouter.swapExactTokensForTokens(
            amountToSwap,
            minAmountOut,
            path,
            address(this),
            deadline
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
        string calldata beneficiaryString,
        string calldata retirementMessage,
        uint256 minAmountOut,
        uint256 deadline
    ) external payable {
        uint256 supply = _totalMinted();
        require( // will restrict to 1 tree per user.
            _numberMinted(msg.sender) + 1 <= 1,
            "Exceed max mintable amount"
        );
        require(supply + 1 <= maxSupply, "Exceed maximum supply");
        require(msg.value == cost * 1, "Incorrect value sent");
        uint256 _nextTokenId = _nextTokenId();
        _mint(msg.sender, 1);
        trees[_nextTokenId].lastWatered = 0;
        trees[_nextTokenId].level = 0; // Default tree level at 0
        uint256 retirementCertificateTokenId = retirementCertificates
            .mintCertificate(
                address(this), // Contract will get the certificate.
                "Into The Verse Tree User",
                msg.sender, // But, msg.sender will be the beneficiary.
                beneficiaryString,
                retirementMessage,
                _retireTC02Tokens(
                    _swapForTC02(
                        (msg.value * redemptionRate) / 100,
                        minAmountOut,
                        deadline
                    )
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

    function upgradeTree(
        uint256 _tokenId,
        uint256 noOfStakes
    ) external onlyGreenDonationContract {
        require(_exists(_tokenId), "Tree does not exist");

        uint256 treeLevel = 0;
        if (noOfStakes == 0) {
            treeLevel = 0;
        } else if (noOfStakes >= 1 && noOfStakes <= 5) {
            treeLevel = 1;
        } else if (noOfStakes > 5 && noOfStakes <= 15) {
            treeLevel = 2;
        } else if (noOfStakes > 15 && noOfStakes <= 30) {
            treeLevel = 3;
        } else if (noOfStakes > 30) {
            treeLevel = 4;
        }

        trees[_tokenId].lastWatered = block.timestamp;
        trees[_tokenId].level = treeLevel;
    }

    function downgradeTree(
        uint256 _tokenId,
        uint256 _balance
    ) external onlyGreenDonationContract {
        require(_exists(_tokenId), "Tree does not exist");

        uint256 minimumStake = GreenDonation(greenDonationContract)
            .getMinimumStake();
        uint256 minimumNoOfTimesStaked = _balance < minimumStake
            ? 0
            : _balance / minimumStake;

        uint256 treeLevel = 0;
        if (minimumNoOfTimesStaked < 1) {
            treeLevel = 0;
        } else if (minimumNoOfTimesStaked > 1 && minimumNoOfTimesStaked <= 5) {
            treeLevel = 1;
        } else if (minimumNoOfTimesStaked > 5 && minimumNoOfTimesStaked <= 15) {
            treeLevel = 2;
        } else if (
            minimumNoOfTimesStaked > 15 && minimumNoOfTimesStaked <= 30
        ) {
            treeLevel = 3;
        } else if (minimumNoOfTimesStaked > 30) {
            treeLevel = 4;
        }

        trees[_tokenId].lastWatered = block.timestamp;
        trees[_tokenId].level = treeLevel;
    }

    function _beforeTokenTransfers(
        // With this tree NFT is no longer burnable, transferable. It is only mintable.
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        if (from == address(0)) {
            // allow mint
            super._beforeTokenTransfers(from, to, tokenId, batchSize);
        } else if (to == address(0)) {
            // disallow burn
            revert("Tree can not burn");
        } else if (to != from) {
            // disallow transfer
            revert("Tree can not transfer");
        } else {
            // disallow other
            revert("Illegal operation");
        }
    }
}
