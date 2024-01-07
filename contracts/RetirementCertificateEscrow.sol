// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract RetirementCertificateEscrow is Ownable, ReentrancyGuard {
    /* ========== STATE VARIABLES ========== */
    struct UserRetirementCertificate {
        uint256 tokenId;
        bool claimed;
    }

    address public greenDonation;

    mapping(address => UserRetirementCertificate[])
        public userRetirementCertificates;

    ERC721Upgradeable public retirementCertificate;

    constructor() Ownable(msg.sender) {}

    function setGreenDonation(
        address _greenDonation
    ) external onlyOwner nonReentrant {
        emit SetGreenDonation(greenDonation, _greenDonation);
        greenDonation = _greenDonation;
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
        address account,
        uint256 tokenId
    ) external nonReentrant {
        require(msg.sender == greenDonation, "Caller not GreenDonation");
        UserRetirementCertificate
            memory certificate = UserRetirementCertificate({
                tokenId: tokenId,
                claimed: false
            });
        userRetirementCertificates[account].push(certificate);
        emit AttachCertificateForClaim(tokenId, account);
    }

    function claimRetirementCertificate(
        uint256[] memory retirementCertificates
    ) external nonReentrant {
        require(msg.sender != greenDonation, "GreenDonation cannot claim");

        UserRetirementCertificate[]
            storage certificates = userRetirementCertificates[msg.sender];

        require(certificates.length > 0, "No certificate found");
        require(
            retirementCertificates.length > 0,
            "No certificate claim requested"
        );

        for (uint256 i = 0; i < retirementCertificates.length; i++) {
            // Fetch the certificate.
            UserRetirementCertificate memory certificate = certificates[i];
            // Validate that the certificate not already claimed.
            require(!certificate.claimed, "Certificate already claimed");
            // Mark the NFT as claimed/transferred.
            certificates[i].claimed = true;
            // Transfer the certificate.
            retirementCertificate.safeTransferFrom(
                greenDonation,
                msg.sender,
                certificate.tokenId
            );
            emit RetirementCertificateClaimed(certificate.tokenId, msg.sender);
        }
    }

    function getUserRetirementCertificates(
        address account
    ) external view returns (UserRetirementCertificate[] memory, uint256) {
        UserRetirementCertificate[]
            memory certificates = userRetirementCertificates[account];

        return (certificates, certificates.length);
    }

    event AttachCertificateForClaim(uint256 indexed tokenId, address account);
    event SetGreenDonation(address oldGreenDonation, address newGreenDonation);
    event RetirementCertificateClaimed(
        uint256 indexed tokenid,
        address claimer
    );
    event SetRetirementCertificate(
        address oldRetirementCertificate,
        address newRetirementCertificate
    );
}
