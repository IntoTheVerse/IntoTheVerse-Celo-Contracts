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
    ) external {
        require(minAmountOut < 10000000000 ether, "minAmountOut");
        require(deadline >= 0, "Invalid deadline");
        return MockERC20(path[path.length - 1]).mint(to, amountIn);
    }
}
