// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import {TreeContract} from "./TreeContract.sol";

contract RetirementCertificateEscrow is Ownable, ReentrancyGuard {
    /* ========== STATE VARIABLES ========== */
    struct UserRetirementCertificate {
        uint256 tree;
        uint256 retirementCertificate;
        bool claimed;
        uint256 index;
    }

    address public greenDonation;

    mapping(uint256 => UserRetirementCertificate[])
        public userRetirementCertificates;

    TreeContract public treeContract;
    ERC721Upgradeable public retirementCertificate;

    constructor() Ownable(msg.sender) {}

    modifier onlyTreeOwner(uint256 tree, address account) {
        require(treeContract.ownerOf(tree) == account, "Not tree owner");
        _;
    }

    modifier onlyGreenDonation(address caller) {
        require(caller == greenDonation, "Caller not GreenDonation");
        _;
    }

    modifier notGreenDonation(address caller) {
        require(caller != greenDonation, "Caller GreenDonation");
        _;
    }

    function setGreenDonation(
        address _greenDonation
    ) external onlyOwner nonReentrant {
        emit SetGreenDonation(greenDonation, _greenDonation);
        greenDonation = _greenDonation;
    }

    function setTreeContract(
        address _treeContract
    ) external onlyOwner nonReentrant {
        emit SetGreenDonation(address(treeContract), _treeContract);
        treeContract = TreeContract(_treeContract);
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
        uint256 tree,
        uint256 _retirementCertificate
    ) external nonReentrant onlyGreenDonation(msg.sender) {
        UserRetirementCertificate
            memory certificate = UserRetirementCertificate({
                retirementCertificate: _retirementCertificate,
                claimed: false,
                tree: tree,
                index: userRetirementCertificates[tree].length
            });
        userRetirementCertificates[tree].push(certificate);
        emit AttachCertificateForClaim(_retirementCertificate, tree);
    }

    function claimRetirementCertificate(
        uint256 tree,
        uint256[] memory userRetirementCertificatesIndexes
    )
        external
        nonReentrant
        onlyTreeOwner(tree, msg.sender)
        notGreenDonation(msg.sender)
    {
        require(msg.sender != greenDonation, "GreenDonation cannot claim");

        UserRetirementCertificate[]
            storage certificates = userRetirementCertificates[tree];

        require(certificates.length > 0, "No certificate found");
        require(
            userRetirementCertificatesIndexes.length > 0,
            "No certificate claim requested"
        );

        for (uint256 i = 0; i < userRetirementCertificatesIndexes.length; i++) {
            // Fetch index.
            uint256 index = userRetirementCertificatesIndexes[i];

            // Fetch the certificate.
            UserRetirementCertificate memory certificate = certificates[index];
            // Validate that the certificate not already claimed.
            require(!certificate.claimed, "Certificate already claimed");
            require(tree == certificate.tree, "Not your tree certificate");
            // Mark the NFT as claimed/transferred.
            certificates[index].claimed = true;
            // Transfer the certificate.
            retirementCertificate.safeTransferFrom(
                greenDonation,
                msg.sender,
                certificate.retirementCertificate
            );
            emit RetirementCertificateClaimed(
                certificate.retirementCertificate,
                tree,
                msg.sender
            );
        }
    }

    function getUserRetirementCertificates(
        uint256 tree
    ) external view returns (UserRetirementCertificate[] memory, uint256) {
        UserRetirementCertificate[]
            memory certificates = userRetirementCertificates[tree];

        return (certificates, certificates.length);
    }

    event SetTreeContract(address oldTreeContract, address newTreeContract);
    event AttachCertificateForClaim(
        uint256 indexed retirementCertificate,
        uint256 tree
    );
    event SetGreenDonation(address oldGreenDonation, address newGreenDonation);
    event RetirementCertificateClaimed(
        uint256 indexed retirementCertificate,
        uint256 tree,
        address claimer
    );
    event SetRetirementCertificate(
        address oldRetirementCertificate,
        address newRetirementCertificate
    );
}
