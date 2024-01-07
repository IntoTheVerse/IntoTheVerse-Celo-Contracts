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
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    uint256 public claimInterval = 7 days;
    mapping(address => uint256) public lastClaimTimestamp;

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

        rewardsToken.approve(address(swapRotuer), type(uint256).max);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
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

    function earned(address account) public view returns (uint256) {
        return
            _balances[account]
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
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
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
        treeContract.waterTree(tokenId);
    }

    function withdraw(
        uint256 tokenId,
        uint256 amount
    ) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
        require(
            treeContract.ownerOf(tokenId) == msg.sender,
            "Cannot downgrade someone elses tree"
        );
        treeContract.downgradeTree(tokenId);
    }

    function _swapRewardTokenForTC02(
        uint256 rewardsAmountToSwap
    ) internal nonReentrant returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = address(rewardsToken);
        path[1] = address(tc02);
        uint256[] memory amountSwapped = swapRotuer.swapExactTokensForTokens(
            rewardsAmountToSwap,
            0, // TOOD: use proper method to fetch amount for TC02 to avoid slippage.
            path,
            address(this),
            block.timestamp
        );
        return amountSwapped[amountSwapped.length - 1];
    }

    function _retireTC02Tokens(
        uint256 amountToRetire
    ) internal nonReentrant returns (uint256[] memory) {
        uint256[] memory retirementEventIds = new uint256[](1);
        retirementEventIds[0] = tc02.retire(amountToRetire);
        return retirementEventIds;
    }

    function getReward(
        string calldata retiringEntityString,
        string calldata beneficiaryString,
        string calldata retirementMessage
    )
        public
        nonReentrant
        updateReward(msg.sender)
        checkClaimingInternval(msg.sender)
    {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            lastClaimTimestamp[msg.sender] = block.timestamp;

            uint256 rewardsToSwapForTC02 = reward.mul(10).div(100);
            rewardsToken.safeTransfer(
                msg.sender,
                reward.sub(rewardsToSwapForTC02)
            );
            emit RewardPaid(msg.sender, reward.sub(rewardsToSwapForTC02));

            uint256 retirementCertificateTokenId = retirementCertificate
                .mintCertificate(
                    address(this), // Contract will get the certificate.
                    retiringEntityString,
                    msg.sender, // But, msg.sender will be the beneficiary.
                    beneficiaryString,
                    retirementMessage,
                    _retireTC02Tokens(
                        _swapRewardTokenForTC02(rewardsToSwapForTC02)
                    )
                );
            ERC721Upgradeable(address(retirementCertificate)).approve(
                address(retirementCertificateEscrow),
                retirementCertificateTokenId
            );
            retirementCertificateEscrow.registerCertificateForClaim(
                msg.sender,
                retirementCertificateTokenId
            );
        }
    }

    function exit(
        uint256 tokenId,
        string calldata retiringEntityString,
        string calldata beneficiaryString,
        string calldata retirementMessage
    ) external {
        withdraw(tokenId, _balances[msg.sender]);
        getReward(retiringEntityString, beneficiaryString, retirementMessage);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(
        uint256 reward
    ) external override onlyRewardsDistribution updateReward(address(0)) {
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

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier checkClaimingInternval(address account) {
        require(
            lastClaimTimestamp[account] + claimInterval <= block.timestamp,
            "Cannot claim twice in same claim epoch"
        );
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event SetSwapRouter(address oldRouter, address newRouter);
    event SetClaimInterval(uint256 oldInterval, uint256 newInterval);
    event SetTreeContract(address oldTreeContract, address newTreeContract);
    event SetRetirementCertificateEscrow(address oldEscrow, address newEscrow);
}
