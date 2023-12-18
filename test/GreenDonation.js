const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe('GreenDonation contract', () => {
  async function fetchFixtures() {
    const DAY = 24 * 60 * 60;
    const ETH = ethers.utils.parseEther('1');
    const HALF_ETH = ETH.mul(50).div(100);

    const provider = ethers.provider;
    const [owner, whale, whale2] = await ethers.getSigners();

    const TC02 = await ethers.getContractFactory('MockTC02');
    const RewardToken = await ethers.getContractFactory('MockERC20');
    const StakingToken = await ethers.getContractFactory('MockERC20');
    const TreeContract = await ethers.getContractFactory('TreeContract');
    const GreenDonation = await ethers.getContractFactory('GreenDonation');
    const SwapRouter = await ethers.getContractFactory('MockUniswapV2Router');
    const RetirementCertificate = await ethers.getContractFactory('MockRetirementCertificate');
    const RetirementCertificateEscrow = await ethers.getContractFactory('RetirementCertificateEscrow');

    const swapRouter = await SwapRouter.deploy();
    const treeContract = await TreeContract.deploy('');
    const tc02 = await TC02.deploy('Toucan protocol token', 'TC02');
    const rewardToken = await RewardToken.deploy('Reward Token', 'RT');
    const stakingToken = await StakingToken.deploy('Stake Token', 'ST');
    const retirementCertificateEscrow = await RetirementCertificateEscrow.deploy();
    const retirementCertificate = await RetirementCertificate.deploy('Retirement Certificate', 'R Cert');
    
    const greenDonation = await GreenDonation.deploy(
      owner.address,
      rewardToken.address,
      stakingToken.address,
      7 * DAY,
      swapRouter.address,
      tc02.address,
      retirementCertificate.address,
      treeContract.address,
      retirementCertificateEscrow.address
    );

    return { provider, ethers, DAY, ETH, HALF_ETH, owner, whale, whale2, TC02, RewardToken, StakingToken, TreeContract, GreenDonation, SwapRouter, RetirementCertificate, RetirementCertificateEscrow , swapRouter, treeContract, tc02, rewardToken, stakingToken, retirementCertificate, greenDonation, retirementCertificateEscrow};
  }
    
  describe('- Access restricted functions', async () => {
    it(' - Should setClaimInterval if owner', async () => {
      const { greenDonation, ETH } = await loadFixture(fetchFixtures)
      expect(await greenDonation.setClaimInterval(ETH)).to.not.reverted;
      expect(await greenDonation.claimInterval()).to.eq(ETH);

       expect(await greenDonation.setClaimInterval(ETH.mul(100))).to.not.reverted;
      expect(await greenDonation.claimInterval()).to.eq(ETH.mul(100));
    });

    it(' - Should not setClaimInterval if not owner', async () => {
      const { greenDonation, ETH, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.connect(whale).setClaimInterval(ETH)).to.reverted;
      expect(await greenDonation.claimInterval()).to.eq(7 * 24 * 60 * 60);
    });

    it(' - Should setSwapRouter if owner', async () => {
      const { greenDonation, whale } = await loadFixture(fetchFixtures)
      expect(await greenDonation.setSwapRouter(whale.address)).to.not.reverted;
      expect(await greenDonation.swapRotuer()).to.eq(whale.address);
    });

    it(' - Should not setSwapRouter if not owner', async () => {
      const { greenDonation, swapRouter, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.connect(whale).setSwapRouter(whale.address)).to.reverted;
      expect(await greenDonation.swapRotuer()).to.eq(swapRouter.address);
    });

    it(' - Should setTreeContract if owner', async () => {
      const { greenDonation, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.setTreeContract(whale.address)).to.not.reverted;
      expect(await greenDonation.treeContract()).to.eq(whale.address);
    });

    it(' - Should not setTreeContract if owner', async () => {
      const { greenDonation, treeContract, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.connect(whale).setTreeContract(whale.address)).to.reverted;
      expect(await greenDonation.treeContract()).to.eq(treeContract.address);
    });

    it(' - Should setRetirementCertificateEscrow if owner', async () => {
      const { greenDonation, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.setRetirementCertificateEscrow(whale.address)).to.not.reverted;
      expect(await greenDonation.retirementCertificateEscrow()).to.eq(whale.address);
    });

    it(' - Should not setRetirementCertificateEscrow if owner', async () => {
      const { greenDonation, retirementCertificateEscrow, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.connect(whale).setRetirementCertificateEscrow(whale.address)).to.reverted;
      expect(await greenDonation.retirementCertificateEscrow()).to.eq(retirementCertificateEscrow.address);
    });

    it(' - Should setRetirementCertificateEscrow if owner', async () => {
      const { greenDonation, whale, rewardToken } = await loadFixture(fetchFixtures)
      await rewardToken.mint(greenDonation.address, 1000);
      await expect(greenDonation.notifyRewardAmount(1000)).to.not.reverted;
      const timestamp = await time.latest();
      expect(await rewardToken.balanceOf(greenDonation.address)).to.eq(1000)
      expect(await greenDonation.periodFinish()).gt(timestamp)
    });

    it(' - Should not notifyRewardAmount if owner', async () => {
      const { greenDonation, rewardToken, whale } = await loadFixture(fetchFixtures)
      await expect(greenDonation.connect(whale).notifyRewardAmount(1000)).to.reverted;
      expect(await rewardToken.balanceOf(greenDonation.address)).to.eq(0)
      expect(await greenDonation.periodFinish()).eq(0)
    });
  });
  
  describe('- Set rewards', async () => {
    it(' - Should notifyRewardAmount properly', async () => {
      const { greenDonation, DAY, ETH, rewardToken } = await loadFixture(fetchFixtures)
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      const timestamp = await time.latest();
      await expect(greenDonation.notifyRewardAmount(ETH.mul(1000))).to.not.reverted;
      expect(await rewardToken.balanceOf(greenDonation.address)).to.eq(ETH.mul(1000))
      expect(await greenDonation.periodFinish()).gt(timestamp)
      expect(await greenDonation.periodFinish()).gt(timestamp + (6 * DAY))
      expect(await greenDonation.periodFinish()).lt(timestamp + (8 * DAY))
    });
  });

  describe('- Stake', async () => {
    it(' - Should stake', async () => {
      const { greenDonation, treeContract, owner, ETH, rewardToken, stakingToken} = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(9));
    });

    it(' - Should not stake if not tree nft owner', async () => {
      const { greenDonation, whale, treeContract, owner, ETH, rewardToken, stakingToken} = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await stakingToken.mint(whale.address, ETH.mul(10));
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.connect(whale).mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      
      await expect(greenDonation.stake(1, ETH)).to.revertedWith('Not tree owner');
      expect(await treeContract.balanceOf(owner.address)).to.eq(0);
      expect(await treeContract.balanceOf(whale.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(whale.address);
      expect((await treeContract.trees(1)).level).to.eq(0);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(0);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(10));
      expect(await stakingToken.balanceOf(whale.address)).to.eq(ETH.mul(10));
    });
  });

  describe('- Withdraw', async () => {
    it(' - Should withdraw', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken} = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;

      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 7 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);

      await expect(greenDonation.withdraw(1, ETH)).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(1);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(0);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(10));
    });

    it(' - Should not withdraw if not tree nft owner', async () => {
      const { greenDonation, provider, DAY, whale, treeContract, owner, ETH, rewardToken, stakingToken} = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;

      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 7 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);

      await expect(greenDonation.connect(whale).withdraw(1, ETH)).to.revertedWith('Not tree owner');
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(9));
    });
  });

  describe('- Get reward', async () => {
    it(' - Should fetch reward', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH.mul(100));
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);

      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      expect(await time.latest()).gt(timestamp);

      const earned = await greenDonation.earned(1);
      expect(earned).to.gt(0);
      expect(await greenDonation.rewards(1)).gt(0)
      const rewardTokenBalanceBefore = await rewardToken.balanceOf(greenDonation.address);

      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(3);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH.mul(2));
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(8));
      expect(await rewardToken.balanceOf(greenDonation.address)).lt(rewardTokenBalanceBefore);
      expect(await rewardToken.balanceOf(owner.address)).gt(0);

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.ownerOf(1)).eq(greenDonation.address);
    });

    it(' - Should not fetch reward if not nft owner', async () => {
      const { greenDonation, whale, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;

      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);

       const earned = await greenDonation.earned(1);
      expect(earned).to.gt(0)
      const rewardTokenBalanceBefore = await rewardToken.balanceOf(greenDonation.address);

      await expect(greenDonation.connect(whale).getReward(1, 'B', 'R')).to.revertedWith('Not tree owner');
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(9));
      expect(await rewardToken.balanceOf(greenDonation.address)).eq(rewardTokenBalanceBefore);
      expect(await rewardToken.balanceOf(owner.address)).eq(0);
    });

    it(' - Should fetch reward multiple times', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;

      let timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);

      const earned = await greenDonation.earned(1);
      expect(earned).to.gt(0)
      let rewardTokenBalanceBefore = await rewardToken.balanceOf(greenDonation.address);

      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(9));
      expect(await rewardToken.balanceOf(greenDonation.address)).lt(rewardTokenBalanceBefore);
      expect(await rewardToken.balanceOf(owner.address)).gt(0);
      expect((await retirementCertificateEscrow.getUserRetirementCertificates(1))[1]).eq(1);

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.ownerOf(1)).eq(greenDonation.address);

      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      rewardTokenBalanceBefore = await rewardToken.balanceOf(greenDonation.address);
      const ownerRewardTokenBalanceBefore = await rewardToken.balanceOf(owner.address);
      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1);
      expect(await treeContract.ownerOf(1)).to.eq(owner.address);
      expect((await treeContract.trees(1)).level).to.eq(2);
      expect(await stakingToken.balanceOf(greenDonation.address)).to.eq(ETH);
      expect(await stakingToken.balanceOf(owner.address)).to.eq(ETH.mul(9));
      expect(await rewardToken.balanceOf(greenDonation.address)).lt(rewardTokenBalanceBefore);
      expect(await rewardToken.balanceOf(owner.address)).gt(ownerRewardTokenBalanceBefore);
      expect((await retirementCertificateEscrow.getUserRetirementCertificates(1))[1]).eq(2);
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);

    });

    it(' - Should fetch reward as per setInterval', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(DAY);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1);
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;

      let timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;

      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;
      
      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;
    });

    it(' - Should not fetch reward as per setInterval', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH.mul(100));
      await treeContract.mint(1);
      let timestamp = await time.latest();
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await greenDonation.setClaimInterval(2 * DAY);

      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      expect(await greenDonation.earned(1)).to.gt(0)
      await expect(greenDonation.getReward(1, 'B', 'R')).to.not.reverted;

      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY]);
      await provider.send("evm_mine");
      timestamp = await time.latest()
      expect(await greenDonation.earned(1)).to.gt(0)
      await expect(greenDonation.getReward(1, 'B', 'R')).to.revertedWith('Cannot claim twice in same claim epoch');
      
      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + DAY / 2]);
      await provider.send("evm_mine");
      expect(await greenDonation.earned(1)).to.gt(0)
      await expect(greenDonation.getReward(1, 'B', 'R')).to.revertedWith('Cannot claim twice in same claim epoch');
    });
  });
});