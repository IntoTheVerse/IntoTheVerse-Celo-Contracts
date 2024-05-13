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
        address ownerContract;
    }

    address public greenDonation;
    uint256 public totalTreesRegistered = 0;

    mapping(uint256 => mapping(uint256 => UserRetirementCertificate))
        public userRetirementCertificates;

    TreeContract public treeContract;
    ERC721Upgradeable public retirementCertificate;

    constructor() Ownable(msg.sender) {}

    modifier onlyTreeOwner(uint256 tree, address account) {
        require(treeContract.ownerOf(tree) == account, "Not tree owner");
        _;
    }

    modifier onlyGreenDonationOrTreeContract(address caller) {
        require(
            caller == greenDonation || caller == address(treeContract),
            "Caller not GreenDonation or tree contract"
        );
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
    ) external nonReentrant onlyGreenDonationOrTreeContract(msg.sender) {
        totalTreesRegistered = totalTreesRegistered + 1;
        UserRetirementCertificate
            memory certificate = UserRetirementCertificate({
                retirementCertificate: _retirementCertificate,
                claimed: false,
                tree: tree,
                index: totalTreesRegistered,
                ownerContract: msg.sender
            });
        userRetirementCertificates[tree][totalTreesRegistered] = certificate;
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
        require(totalTreesRegistered > 0, "No certificates found");
        require(
            userRetirementCertificatesIndexes.length > 0,
            "No certificate claim requested"
        );

        for (uint256 i = 0; i < userRetirementCertificatesIndexes.length; i++) {
            // Fetch index.
            uint256 index = userRetirementCertificatesIndexes[i];

            // Fetch the certificate.
            UserRetirementCertificate
                storage certificate = userRetirementCertificates[tree][index];
            // Validate that the certificate not already claimed.
            require(!certificate.claimed, "Certificate already claimed");
            require(tree == certificate.tree, "Not your tree certificate");
            require(
                index == certificate.index,
                "Not your tree index in registration"
            );
            // Mark the NFT as claimed/transferred.
            userRetirementCertificates[tree][index].claimed = true;
            // Transfer the certificate.
            retirementCertificate.safeTransferFrom(
                certificate.ownerContract,
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

    function getUserRetirementCertificate(
        uint256 tree,
        uint256 index
    ) external view returns (UserRetirementCertificate memory) {
        return userRetirementCertificates[tree][index];
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
