// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract MarketplaceRetirementCertificateEscrow is Ownable, ReentrancyGuard {
    /* ========== STATE VARIABLES ========== */
    struct UserRetirementCertificate {
        uint256 tokenId;
        uint256 retirementCertificate;
        bool claimed;
        uint256 index;
        address nftAddress;
    }

    address public nftMarketplace;
    uint256 public totalRegistered = 0;

    mapping(bytes => mapping(uint256 => UserRetirementCertificate))
        public userRetirementCertificates;

    ERC721Upgradeable public retirementCertificate;

    constructor() Ownable(msg.sender) {}

    modifier onlyNFTOwner(
        address nftAddress,
        uint256 tokenId,
        address account
    ) {
        ERC721Upgradeable nft = ERC721Upgradeable(nftAddress);
        require(nft.ownerOf(tokenId) == account, "Not token owner");
        _;
    }

    modifier onlyNftMarketplace(address caller) {
        require(caller == nftMarketplace, "Caller not NFTMarketplace");
        _;
    }

    function setNFTMarketplace(
        address _marketplace
    ) external onlyOwner nonReentrant {
        emit SetNFTMarketplace(nftMarketplace, _marketplace);
        nftMarketplace = _marketplace;
    }

    function setRetirementCertificate(
        address _retirementCertificate
    ) external onlyOwner nonReentrant {
        emit SetRetirementCertificate(
            address(retirementCertificate),
            _retirementCertificate
        );
        retirementCertificate = ERC721Upgradeable(_retirementCertificate);
    }

    function registerCertificateForClaim(
        address nftAddress,
        uint256 tokenId,
        uint256 _retirementCertificate
    ) external nonReentrant onlyNftMarketplace(msg.sender) {
        totalRegistered = totalRegistered + 1;
        bytes memory key = abi.encode(nftAddress, tokenId);
        UserRetirementCertificate
            memory certificate = UserRetirementCertificate({
                retirementCertificate: _retirementCertificate,
                claimed: false,
                tokenId: tokenId,
                index: totalRegistered,
                nftAddress: nftAddress
            });
        userRetirementCertificates[key][totalRegistered] = certificate;
        emit AttachCertificateForClaim(
            _retirementCertificate,
            tokenId,
            nftAddress
        );
    }

    function claimRetirementCertificate(
        address nftAddress,
        uint256 tokenId,
        uint256[] memory userRetirementCertificatesIndexes
    )
        external
        nonReentrant
        onlyNFTOwner(nftAddress, tokenId, msg.sender)
    {
        require(msg.sender != nftMarketplace, "Marketplace cannot claim");
        require(totalRegistered > 0, "No certificate found");
        require(
            userRetirementCertificatesIndexes.length > 0,
            "No certificate claim requested"
        );

        bytes memory key = abi.encode(nftAddress, tokenId);

        for (uint256 i = 0; i < userRetirementCertificatesIndexes.length; i++) {
            // Fetch index.
            uint256 index = userRetirementCertificatesIndexes[i];

            // Fetch the certificate.
            UserRetirementCertificate
                storage certificate = userRetirementCertificates[key][index];
            // Validate that the certificate not already claimed.
            require(!certificate.claimed, "Certificate already claimed");
            require(tokenId == certificate.tokenId, "Not your nft");
            require(index == certificate.index, "Not your nft");
            require(
                nftAddress == certificate.nftAddress,
                "Not correct NFT address"
            );
            // Mark the NFT as claimed/transferred.
            userRetirementCertificates[key][index].claimed = true;
            // Transfer the certificate.
            retirementCertificate.safeTransferFrom(
                nftMarketplace,
                msg.sender,
                certificate.retirementCertificate
            );
            emit RetirementCertificateClaimed(
                nftAddress,
                certificate.retirementCertificate,
                tokenId,
                msg.sender
            );
        }
    }

    function getUserRetirementCertificate(
        address nftAddress,
        uint256 tokenId,
        uint256 index
    ) external view returns (UserRetirementCertificate memory) {
        bytes memory key = abi.encode(nftAddress, tokenId);
        return userRetirementCertificates[key][index];
    }

    event AttachCertificateForClaim(
        uint256 indexed retirementCertificate,
        uint256 tokenId,
        address nftAddress
    );
    event SetNFTMarketplace(address oldMarketplace, address newMarketplace);
    event RetirementCertificateClaimed(
        address nftAddress,
        uint256 indexed retirementCertificate,
        uint256 tokenId,
        address claimer
    );
    event SetRetirementCertificate(
        address oldRetirementCertificate,
        address newRetirementCertificate
    );
}
