const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('RetirementCertificateEscrow contract', () => {
  async function fetchFixtures() {
    const DAY = 24 * 60 * 60;
    const ETH = ethers.utils.parseEther('1');
    const HALF_ETH = ETH.mul(50).div(100);

    const provider = ethers.provider;
    const [owner, whale, whale2] = await ethers.getSigners();

    const TC02 = await ethers.getContractFactory('MockTC02');
    const WETH = await ethers.getContractFactory('MockERC20');
    const RewardToken = await ethers.getContractFactory('MockERC20');
    const StakingToken = await ethers.getContractFactory('MockERC20');
    const TreeContract = await ethers.getContractFactory('TreeContract');
    const GreenDonation = await ethers.getContractFactory('GreenDonation');
    const SwapRouter = await ethers.getContractFactory('MockUniswapV2Router');
    const RetirementCertificate = await ethers.getContractFactory('MockRetirementCertificate');
    const RetirementCertificateEscrow = await ethers.getContractFactory('RetirementCertificateEscrow');

    const swapRouter = await SwapRouter.deploy();
    const weth = await WETH.deploy('WETH', 'WETH');
    const tc02 = await TC02.deploy('Toucan protocol token', 'TC02');
    const retirementCertificate = await RetirementCertificate.deploy('Retirement Certificate', 'R Cert');
    const treeContract = await TreeContract.deploy('', tc02.address, weth.address, retirementCertificate.address, swapRouter.address);
    const rewardToken = await RewardToken.deploy('Reward Token', 'RT');
    const stakingToken = await StakingToken.deploy('Stake Token', 'ST');
    const retirementCertificateEscrow = await RetirementCertificateEscrow.deploy();
    
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

    await treeContract.setSwapRouter(swapRouter.address);
    await treeContract.setRetirementCertificateEscrow(retirementCertificateEscrow.address);
    await retirementCertificateEscrow.setTreeContract(treeContract.address);

    return { provider, ethers, DAY, ETH, HALF_ETH, owner, whale, whale2, TC02, RewardToken, StakingToken, TreeContract, GreenDonation, SwapRouter, RetirementCertificate, RetirementCertificateEscrow , swapRouter, treeContract, tc02, rewardToken, stakingToken, retirementCertificate, greenDonation, retirementCertificateEscrow};
  }

  describe('- Access restricted functions', async () => {
    it(' - Should setGreenDonation if owner', async () => {
      const { whale, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      expect(await retirementCertificateEscrow.setGreenDonation(whale.address)).to.not.reverted;
      expect(await retirementCertificateEscrow.greenDonation()).to.eq(whale.address);
    });

    it(' - Should not setGreenDonation if not owner', async () => {
      const { whale, retirementCertificateEscrow, whale2 } = await loadFixture(fetchFixtures)
      await expect(retirementCertificateEscrow.connect(whale).setGreenDonation(whale2.address)).to.reverted;
      expect(await retirementCertificateEscrow.greenDonation()).to.eq(ZERO_ADDRESS);
    });

    it(' - Should setTreeContract if owner', async () => {
      const { whale, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      expect(await retirementCertificateEscrow.setTreeContract(whale.address)).to.not.reverted;
      expect(await retirementCertificateEscrow.treeContract()).to.eq(whale.address);
    });

    it(' - Should not setTreeContract if not owner', async () => {
      const { whale, retirementCertificateEscrow, whale2, treeContract } = await loadFixture(fetchFixtures)
      await expect(retirementCertificateEscrow.connect(whale).setTreeContract(whale2.address)).to.reverted;
      expect(await retirementCertificateEscrow.treeContract()).to.eq(treeContract.address);
    });

    it(' - Should setRetirementCertificate if owner', async () => {
      const { whale, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      expect(await retirementCertificateEscrow.setRetirementCertificate(whale.address)).to.not.reverted;
      expect(await retirementCertificateEscrow.retirementCertificate()).to.eq(whale.address);
    });

    it(' - Should not setRetirementCertificate if not owner', async () => {
      const { whale, retirementCertificateEscrow, whale2 } = await loadFixture(fetchFixtures)
      await expect(retirementCertificateEscrow.connect(whale).setRetirementCertificate(whale2.address)).to.reverted;
      expect(await retirementCertificateEscrow.retirementCertificate()).to.eq(ZERO_ADDRESS);
    });

  });

  describe('- Claim Certificate', async () => {
    it(' - Should claim retirement certificate from staking', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [1])).to.not.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate1[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate1[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
    });

    it(' - Should not claim retirement certificate from staking if not tree owner', async () => {
      const { greenDonation, provider, whale, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);

      await expect(retirementCertificateEscrow.connect(whale).claimRetirementCertificate(1, [1])).to.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate1[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(false)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate1[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
    });

    it(' - Should claim retirement certificate from tree', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.not.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate1[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(false)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate1[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
    });

    it(' - Should claim retirement certificate from both tree and staking', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0, 1])).to.not.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate1[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate1[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
    });

    it(' - Should not claim retirement certificate if not tree owner', async () => {
      const { greenDonation, whale, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.connect(whale).claimRetirementCertificate(1, [0])).to.revertedWith("Not tree owner");
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(false)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
    });

    it(' - Should not claim retirement certificate if already claimed', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.not.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(false)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.revertedWith('Certificate already claimed');
      const userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate2[0][0].claimed).eq(true)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate2[0][1].claimed).eq(false)
      expect(userRetirementCertificate2[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
    });

    it(' - Should not affect other claim retirement certificate when 2 trees', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH.mul(10));
      await treeContract.mint(1, '', '');
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      await expect(greenDonation.stake(2, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');
      await greenDonation.getReward(2, 'B', 'R');

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(3)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);
      let userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][1].claimed).eq(false)
      expect(userRetirementCertificate2[0][1].retirementCertificate).eq(4)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(userRetirementCertificate2[0][1].tree).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(4)).eq(greenDonation.address);
      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.not.reverted;
      
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(3)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1);
      expect(userRetirementCertificate[0][1].tree).eq(1);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);
      
      userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(userRetirementCertificate2[0][1].claimed).eq(false)
      expect(userRetirementCertificate2[0][1].retirementCertificate).eq(4)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(4)).eq(greenDonation.address);
      
      await expect(retirementCertificateEscrow.claimRetirementCertificate(2, [0])).to.not.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1);
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(3)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);
      userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(true)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(userRetirementCertificate2[0][1].claimed).eq(false)
      expect(userRetirementCertificate2[0][1].retirementCertificate).eq(4)
      expect(userRetirementCertificate2[1]).eq(2)
      expect(userRetirementCertificate2[0][1].tree).eq(2)
      expect(await retirementCertificate.ownerOf(4)).eq(greenDonation.address);
    });

    it(' - Should not affect other claim retirement certificate', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH.mul(10));
      await treeContract.mint(2, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      await expect(greenDonation.stake(2, ETH)).to.not.reverted;
      const timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');
      await greenDonation.getReward(2, 'B', 'R');

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      let userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(3)
      expect(userRetirementCertificate2[1]).eq(1)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.not.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1);
      expect(userRetirementCertificate[0][1].tree).eq(1);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(3)
      expect(userRetirementCertificate2[1]).eq(1)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(2, [0])).to.not.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][0].tree).eq(1);
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[1]).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1);
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(2);
      expect(userRetirementCertificate2[0][0].claimed).eq(true)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(3)
      expect(userRetirementCertificate2[1]).eq(1)
      expect(userRetirementCertificate2[0][0].tree).eq(2)
      expect(await retirementCertificate.ownerOf(3)).eq(owner.address);
    });

    it(' - Should claim both retirement certificate', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      let timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');
      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[0][2].claimed).eq(false)
      expect(userRetirementCertificate[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0, 1])).to.not.reverted;
      const userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
       expect(userRetirementCertificate1[0][2].claimed).eq(false)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);
    });

    it(' - Should claim both retirement certificate', async () => {
      const { greenDonation, provider, DAY, treeContract, owner, ETH, rewardToken, stakingToken, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
      
      await rewardToken.mint(greenDonation.address, ETH.mul(1000));
      await greenDonation.notifyRewardAmount(ETH.mul(1000));
      await greenDonation.setClaimInterval(0);
      await stakingToken.mint(owner.address, ETH.mul(10));
      await stakingToken.approve(greenDonation.address, ETH);
      await treeContract.mint(1, '', '');
      await treeContract.setGreenDonationContract(greenDonation.address);
      await retirementCertificateEscrow.setGreenDonation(greenDonation.address);
      await retirementCertificateEscrow.setTreeContract(treeContract.address);
      await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address);
      await expect(greenDonation.stake(1, ETH)).to.not.reverted;
      let timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');
      timestamp = await time.latest()
      await provider.send("evm_setNextBlockTimestamp", [timestamp + 2 * DAY]);
      await provider.send("evm_mine");
      expect(await time.latest()).gt(timestamp);
      await greenDonation.getReward(1, 'B', 'R');

      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[0][1].claimed).eq(false)
      expect(userRetirementCertificate[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate[0][2].claimed).eq(false)
      expect(userRetirementCertificate[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(greenDonation.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [1])).to.not.reverted;
      let userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[0][2].claimed).eq(false)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(greenDonation.address);
      
      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0, 1])).to.revertedWith('Certificate already claimed');

      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [2])).to.not.reverted;
      userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[0][2].claimed).eq(true)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(owner.address);
      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [2])).to.reverted;
      userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(false)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[0][2].claimed).eq(true)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(treeContract.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(owner.address);
      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.not.reverted;
      userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[0][2].claimed).eq(true)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(owner.address);
      await expect(retirementCertificateEscrow.claimRetirementCertificate(1, [0])).to.reverted;
      userRetirementCertificate1 = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate1[0][0].claimed).eq(true)
      expect(userRetirementCertificate1[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate1[0][1].claimed).eq(true)
      expect(userRetirementCertificate1[0][1].retirementCertificate).eq(2)
      expect(userRetirementCertificate[0][1].tree).eq(1)
      expect(userRetirementCertificate1[0][2].claimed).eq(true)
      expect(userRetirementCertificate1[0][2].retirementCertificate).eq(3)
      expect(userRetirementCertificate[0][2].tree).eq(1)
      expect(userRetirementCertificate1[1]).eq(3)
      expect(await retirementCertificate.ownerOf(1)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(2)).eq(owner.address);
      expect(await retirementCertificate.ownerOf(3)).eq(owner.address);
    });
  });
});