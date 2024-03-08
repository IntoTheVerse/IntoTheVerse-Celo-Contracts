// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {MockERC20} from "./MockERC20.sol";

contract MockUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minAmountOut,
        address[] memory path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory) {
        require(minAmountOut < 10000000000 ether, "minAmountOut");
        require(deadline >= 0, "Invalid deadline");
        MockERC20(path[path.length - 1]).mint(to, amountIn);
        uint256[] memory amountOuts = new uint256[](path.length);
        for (uint256 i = 0; i < path.length; i++) {
            amountOuts[i] = 0;
        }
        amountOuts[amountOuts.length - 1] = amountIn;
        return amountOuts;
    }

    function swapExactETHForTokens(
        uint256 minAmountOut,
        address[] memory path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory) {
        require(minAmountOut < 10000000000 ether, "minAmountOut");
        require(deadline >= 0, "Invalid deadline");
        MockERC20(path[path.length - 1]).mint(to, msg.value);
        uint256[] memory amountOuts = new uint256[](path.length);
        for (uint256 i = 0; i < path.length; i++) {
            amountOuts[i] = 0;
        }
        amountOuts[amountOuts.length - 1] = msg.value;
        return amountOuts;
    }
}
