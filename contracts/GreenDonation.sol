// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

import {ITC02} from "./interfaces/ITC02.sol";
import {SafeMath} from "./utils/SafeMath.sol";
import {TreeContract} from "./TreeContract.sol";
import {RetirementCertificateEscrow} from "./RetirementCertificateEscrow.sol";
import {RewardsDistributionRecipient} from "./RewardsDistributionRecipient.sol";
import {IRetirementCertificates} from "./interfaces/IRetirementCertificates.sol";

contract GreenDonation is
    RewardsDistributionRecipient,
    ReentrancyGuard,
    Ownable
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public rewardsToken;
    IERC20 public stakingToken;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardsDuration;
    uint256 public periodFinish = 0;
    uint256 public rewardPerTokenStored;

    uint256 public redemptionRate = 10;

    mapping(uint256 => uint256) public userRewardPerTokenPaid;
    mapping(uint256 => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(uint256 => uint256) private _balances;

    uint256 public minimumStake = 1 ether; // 1 CELO.
    uint256 public claimInterval = 7 days;
    uint256 public stakeInterval = 7 days;
    mapping(uint256 => uint256) public lastStakeTimestamp;
    mapping(uint256 => uint256) public lastClaimTimestamp;

    ITC02 public tc02;
    TreeContract public treeContract;
    IUniswapV2Router02 public swapRotuer;
    IRetirementCertificates public retirementCertificate;
    RetirementCertificateEscrow public retirementCertificateEscrow;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        uint256 _rewardsDuration,
        address _swapRouter,
        address _tc02,
        address _retirementCertificate,
        address _treeContract,
        address _retirementCertificateEscrow
    ) Ownable(msg.sender) {
        rewardsToken = IERC20(_rewardsToken);
        stakingToken = IERC20(_stakingToken);
        rewardsDistribution = _rewardsDistribution;
        rewardsDuration = _rewardsDuration;
        swapRotuer = IUniswapV2Router02(_swapRouter);
        tc02 = ITC02(_tc02);
        treeContract = TreeContract(_treeContract);
        retirementCertificate = IRetirementCertificates(_retirementCertificate);
        retirementCertificateEscrow = RetirementCertificateEscrow(
            _retirementCertificateEscrow
        );

        minimumStake = 1 * (10 ** IERC20(_stakingToken).decimals());
        rewardsToken.approve(address(swapRotuer), type(uint256).max);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(uint256 tree) external view returns (uint256) {
        return _balances[tree];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external returns (bytes4) {
        // Only retirement certificates can transfer NFT to this contract.
        require(
            msg.sender == address(retirementCertificate),
            "Not retirement certificate"
        );
        return this.onERC721Received.selector;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(_totalSupply)
            );
    }

    function earned(uint256 tree) public view returns (uint256) {
        return
            _balances[tree]
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[tree]))
                .div(1e18)
                .add(rewards[tree]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function setClaimInterval(
        uint256 interval
    ) external nonReentrant onlyOwner {
        emit SetClaimInterval(claimInterval, interval);
        claimInterval = interval;
    }

    function setStakeInterval(
        uint256 interval
    ) external nonReentrant onlyOwner {
        emit SetStakeInterval(stakeInterval, interval);
        stakeInterval = interval;
    }

    function setRedemptionRate(
        uint256 rate
    ) external nonReentrant onlyOwner {
        emit SetRedemptionRate(redemptionRate, rate);
        redemptionRate = rate;
    }

    function setSwapRouter(address router) external nonReentrant onlyOwner {
        emit SetSwapRouter(address(swapRotuer), router);
        swapRotuer = IUniswapV2Router02(router);
    }

    function setTreeContract(
        address _treeContract
    ) external nonReentrant onlyOwner {
        emit SetTreeContract(address(treeContract), _treeContract);
        treeContract = TreeContract(_treeContract);
    }

    function setRetirementCertificateEscrow(
        address _escrow
    ) external nonReentrant onlyOwner {
        emit SetRetirementCertificateEscrow(
            address(retirementCertificateEscrow),
            _escrow
        );
        retirementCertificateEscrow = RetirementCertificateEscrow(_escrow);
    }

    function stake(
        uint256 tree,
        uint256 amount
    ) external nonReentrant updateReward(tree) onlyTreeOwner(tree, msg.sender) checkStakingInternval(tree) {
        require(amount > 0, "Cannot stake 0");
        require(amount > minimumStake, "Minimum stake not met");
        lastStakeTimestamp[tree] = block.timestamp;
        _totalSupply = _totalSupply.add(amount);
        _balances[tree] = _balances[tree].add(amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(tree, msg.sender, amount);
        treeContract.waterTree(tree);
    }

    function withdraw(
        uint256 tree,
        uint256 amount
    ) public nonReentrant updateReward(tree) onlyTreeOwner(tree, msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply.sub(amount);
        _balances[tree] = _balances[tree].sub(amount);
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(tree, msg.sender, amount);
        treeContract.downgradeTree(tree);
    }

    function _swapRewardTokenForTC02(
        uint256 rewardsAmountToSwap,
        uint256 minOut,
        uint256 deadline
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = address(rewardsToken);
        path[1] = address(tc02);
        uint256[] memory amountSwapped = swapRotuer.swapExactTokensForTokens(
            rewardsAmountToSwap,
            minOut,
            path,
            address(this),
            deadline
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

    function getReward(
        uint256 tree,
        string calldata beneficiaryString,
        string calldata retirementMessage,
        uint256 minOut,
        uint256 deadline
    )
        public
        nonReentrant
        updateReward(tree)
        checkClaimingInternval(tree)
        onlyTreeOwner(tree, msg.sender)
    {
        uint256 reward = rewards[tree];
        if (reward > 0) {
            rewards[tree] = 0;
            lastClaimTimestamp[tree] = block.timestamp;
            uint256 rewardsToSwapForTC02 = reward.mul(redemptionRate).div(100);
            rewardsToken.safeTransfer(
                msg.sender,
                reward.sub(rewardsToSwapForTC02)
            );
            emit RewardPaid(tree, msg.sender, reward.sub(rewardsToSwapForTC02));
            uint256 retirementCertificateTokenId = retirementCertificate
                .mintCertificate(
                    address(this), // Contract will get the certificate.
                    "Into The Verse Green Donation User",
                    msg.sender, // But, msg.sender will be the beneficiary.
                    beneficiaryString,
                    retirementMessage,
                    _retireTC02Tokens(
                        _swapRewardTokenForTC02(rewardsToSwapForTC02, minOut, deadline)
                    )
                );
            ERC721Upgradeable(address(retirementCertificate)).approve(
                address(retirementCertificateEscrow),
                retirementCertificateTokenId
            );
            retirementCertificateEscrow.registerCertificateForClaim(
                tree,
                retirementCertificateTokenId
            );
        }
    }

    function exit(
        uint256 tree,
        string calldata beneficiaryString,
        string calldata retirementMessage
    ) external {
        withdraw(tree, _balances[tree]);
        getReward(tree, beneficiaryString, retirementMessage);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(
        uint256 reward
    ) external override onlyRewardsDistribution updateReward(0) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint balance = rewardsToken.balanceOf(address(this));
        require(
            rewardRate <= balance.div(rewardsDuration),
            "Provided reward too high"
        );

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);
        emit RewardAdded(reward);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(uint256 tree) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (tree != 0) {
            rewards[tree] = earned(tree);
            userRewardPerTokenPaid[tree] = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyTreeOwner(uint256 tree, address account) {
        require(treeContract.ownerOf(tree) == account, "Not tree owner");
        _;
    }

    modifier checkClaimingInternval(uint256 tree) {
        require(
            lastClaimTimestamp[tree] + claimInterval <= block.timestamp,
            "Cannot claim twice in same claim epoch"
        );
        _;
    }

    modifier checkStakingInternval(uint256 tree) {
        require(
            lastStakeTimestamp[tree] + stakeInterval <= block.timestamp,
            "Cannot stake twice in same stake epoch"
        );
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event SetRedemptionRate(uint256 oldRate, uint256 newRate);
    event SetSwapRouter(address oldRouter, address newRouter);
    event SetClaimInterval(uint256 oldInterval, uint256 newInterval);
    event SetStakeInterval(uint256 oldInterval, uint256 newInterval);
    event Staked(uint256 indexed tree, address user, uint256 amount);
    event Withdrawn(uint256 indexed tree, address user, uint256 amount);
    event RewardPaid(uint256 indexed tree, address user, uint256 reward);
    event SetTreeContract(address oldTreeContract, address newTreeContract);
    event SetRetirementCertificateEscrow(address oldEscrow, address newEscrow);
}
