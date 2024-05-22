// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import {ITC02} from "./interfaces/ITC02.sol";
import {MarketplaceRetirementCertificateEscrow} from "./MarketplaceRetirementCertificateEscrow.sol";
import {IRetirementCertificates} from "./interfaces/IRetirementCertificates.sol";

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProceeds();
error NotOwner();
error NotApprovedForMarketplace();
error PriceMustBeAboveZero();
error NFTNotWhilelisted(address nftAddress);

contract NftMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 price;
        address seller;
    }

    uint256 public redemptionRate = 10; // Percent of rewards to offset.
    address public wrappedNativeToken; // Celo native token.

    ITC02 public tc02;
    IUniswapV2Router02 public swapRouter;
    IRetirementCertificates public retirementCertificate;
    MarketplaceRetirementCertificateEscrow public retirementCertificateEscrow;

    event SetRedemptionRate(uint256 oldRate, uint256 rate);
    event SetRetirementCertificateEscrow(address oldEscrow, address newEscrow);
    event SetSwapRouter(address swapRouter, address newSwapRouter);
    event SetNftWhitelistValue(
        address nftAddress,
        bool oldValue,
        bool newValue
    );

    constructor(
        address _swapRouter,
        address _tc02,
        address _retirementCertificate,
        address _retirementCertificateEscrow,
        address _wrappedNativeToken
    ) Ownable(msg.sender) {
        swapRouter = IUniswapV2Router02(_swapRouter);
        tc02 = ITC02(_tc02);
        retirementCertificate = IRetirementCertificates(_retirementCertificate);
        retirementCertificateEscrow = MarketplaceRetirementCertificateEscrow(
            _retirementCertificateEscrow
        );
        wrappedNativeToken = _wrappedNativeToken;

        IERC20(_wrappedNativeToken).approve(
            address(_swapRouter),
            type(uint256).max
        );
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemLocked(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );
    event ItemUnlocked(
        address indexed seller,
        address indexed buyer,
        address indexed nftAddress,
        uint256 tokenId
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    mapping(address => uint256) private s_proceeds;
    mapping(address => bool) public whitelistedNfts;
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    modifier isWhitelistedNft(address nftAddress) {
        if (!whitelistedNfts[nftAddress]) {
            revert NFTNotWhilelisted(nftAddress);
        }
        _;
    }

    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        if (s_listings[nftAddress][tokenId].price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier isListingOwner(
        address nftAddress,
        uint256 tokenId,
        address seller
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.seller != seller) {
            revert NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    function setRedemptionRate(uint256 _rate) external nonReentrant onlyOwner {
        emit SetRedemptionRate(redemptionRate, _rate);
        redemptionRate = _rate;
    }

    function setSwapRouter(address router) external nonReentrant onlyOwner {
        emit SetSwapRouter(address(swapRouter), router);
        swapRouter = IUniswapV2Router02(router);
    }

    function toggleNftWhitelistValue(
        address nftAddress
    ) external nonReentrant onlyOwner {
        bool value = whitelistedNfts[nftAddress];
        emit SetNftWhitelistValue(nftAddress, value, !value);
        whitelistedNfts[nftAddress] = !value;
    }

    function setRetirementCertificateEscrow(
        address _retirementCertificateEscrow
    ) external nonReentrant onlyOwner {
        emit SetRetirementCertificateEscrow(
            address(retirementCertificateEscrow),
            _retirementCertificateEscrow
        );
        retirementCertificateEscrow = MarketplaceRetirementCertificateEscrow(
            _retirementCertificateEscrow
        );
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
        isWhitelistedNft(nftAddress)
    {
        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketplace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
        // Transfer the NFT to this contract to lock it.
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        emit ItemLocked(msg.sender, nftAddress, tokenId, price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isListed(nftAddress, tokenId)
        isListingOwner(nftAddress, tokenId, msg.sender)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);

        // Transfer the NFT from this contract to user to unlock it.
        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);
        emit ItemUnlocked(msg.sender, msg.sender, nftAddress, tokenId);
    }

    // NOTE: this is no longer needed, because on listing NFT is transferred from user to this address
    // so this function can be called by others in my opinion- review required here.
    // function onERC721Received(
    //     address,
    //     address from,
    //     uint256 tokenId,
    //     bytes calldata
    // ) external returns (bytes4) {
    //     // Only retirement certificates can transfer NFT to this contract.
    //     require(
    //         msg.sender == address(retirementCertificate),
    //         "Not retirement certificate"
    //     );
    //     return this.onERC721Received.selector;
    // }

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

    function buyItem(
        address nftAddress,
        uint256 tokenId
    )
        external
        payable
        isOwner(nftAddress, tokenId, address(this)) // To check that this nft is with contract (i.e locked)
        isListed(nftAddress, tokenId)
        isWhitelistedNft(nftAddress)
        nonReentrant
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value != listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        uint256 retirementCertificateTokenId = retirementCertificate
            .mintCertificate(
                address(this), // Contract will get the certificate.
                "Into The Verse Marketplace User",
                msg.sender, // But, msg.sender will be the beneficiary.
                "Into The Verse Marketplace beneficiary",
                "Into The Verse Marketplace retirement",
                _retireTC02Tokens(
                    _swapForTC02((msg.value * redemptionRate) / 100)
                )
            );

        ERC721Upgradeable(address(retirementCertificate)).approve(
            address(retirementCertificateEscrow),
            retirementCertificateTokenId
        );

        retirementCertificateEscrow.registerCertificateForClaim(
            nftAddress,
            tokenId,
            retirementCertificateTokenId
        );

        s_proceeds[listedItem.seller] += (msg.value -
            ((msg.value * redemptionRate) / 100));
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom( // Transfer locked asset to user from this contract.
            address(this),
            msg.sender,
            tokenId
        );
        emit ItemUnlocked(listedItem.seller, msg.sender, nftAddress, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListingOwner(nftAddress, tokenId, msg.sender) // Check that msg.sender is owner of listing.
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        if (newPrice == 0) {
            revert PriceMustBeAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NoProceeds();
        }
        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
