// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IRetirementCertificates {
    function mintCertificate(
        address retiringEntity,
        string calldata retiringEntityString,
        address beneficiary,
        string calldata beneficiaryString,
        string calldata retirementMessage,
        uint256[] calldata retirementEventIds
    ) external returns (uint256);
}
