// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ITC02 {
    function retire(
        uint256 amount
    ) external returns (uint256 retirementEventId);
}
