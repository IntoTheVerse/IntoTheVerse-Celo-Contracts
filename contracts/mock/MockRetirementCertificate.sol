// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockRetirementCertificate is ERC721 {
    uint256 tokenId = 0;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {}

    function mintCertificate(
        address retiringEntity,
        string calldata retiringEntityString,
        address beneficiary,
        string calldata beneficiaryString,
        string calldata retirementMessage,
        uint256[] calldata retirementEventIds
    ) external returns (uint256) {
        tokenId++;
        _mint(retiringEntity, tokenId);
        return tokenId;
    }
}
