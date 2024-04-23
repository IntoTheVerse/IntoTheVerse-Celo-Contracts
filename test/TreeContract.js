const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe('TreeContract', () => {
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

    return { provider, ethers, DAY, weth, ETH, HALF_ETH, owner, whale, whale2, TC02, RewardToken, StakingToken, TreeContract, GreenDonation, SwapRouter, RetirementCertificate, RetirementCertificateEscrow , swapRouter, treeContract, tc02, rewardToken, stakingToken, retirementCertificate, greenDonation, retirementCertificateEscrow};
  }
    
  describe('- Access restricted functions', async () => {
    it(' - Should set cost if owner', async () => {
      const { treeContract, ETH } = await loadFixture(fetchFixtures)
      expect(await treeContract.setCost(ETH)).to.not.reverted;
      expect(await treeContract.cost()).to.eq(ETH);

       expect(await treeContract.setCost(ETH.mul(100))).to.not.reverted;
      expect(await treeContract.cost()).to.eq(ETH.mul(100));
    });

    it(' - Should not set cost if not owner', async () => {
      const { treeContract, ETH, whale } = await loadFixture(fetchFixtures)
      await expect(treeContract.connect(whale).setCost(ETH)).to.reverted;
      expect(await treeContract.cost()).to.eq(0);
    });

    it(' - Should set green donation if owner', async () => {
      const { treeContract, ETH, whale } = await loadFixture(fetchFixtures)
      expect(await treeContract.setGreenDonationContract(whale.address)).to.not.reverted;
      expect(await treeContract.greenDonationContract()).to.eq(whale.address);
    });

    it(' - Should not set green donation if not owner', async () => {
      const { treeContract, whale, greenDonation } = await loadFixture(fetchFixtures)
      await expect(treeContract.connect(whale).setGreenDonationContract(whale.address)).to.reverted;
      expect(await treeContract.greenDonationContract()).to.eq('0x0000000000000000000000000000000000000000');
    });

    it(' - Should set base uri if owner', async () => {
      const { treeContract, ETH, whale } = await loadFixture(fetchFixtures)
      expect(await treeContract.setBaseURI('ABC')).to.not.reverted;
      expect(await treeContract._baseTokenURI()).to.eq('ABC');
    });

    it(' - Should not set base uri if not owner', async () => {
      const { treeContract, whale } = await loadFixture(fetchFixtures)
      await expect(treeContract.connect(whale).setBaseURI('ABC')).to.reverted;
      expect(await treeContract._baseTokenURI()).to.eq('');
    });

    it(' - Should withdraw if owner', async () => {
      const { treeContract, ETH, whale } = await loadFixture(fetchFixtures)
      expect(await treeContract.withdraw()).to.not.reverted;
    });

    it(' - Should withdraw if owner', async () => {
      const { treeContract, ETH, whale } = await loadFixture(fetchFixtures)
      expect(await treeContract.withdraw()).to.not.reverted;
    });    
  });

  describe('- Tree levels', async () => {
    it(' - Should upgrade tree if green donation', async () => {
      const { treeContract, whale, owner } = await loadFixture(fetchFixtures)
      await treeContract.mint('', '', 0, Date.now());
      await expect(treeContract.connect(owner).setGreenDonationContract(whale.address)).to.not.reverted;
      await expect(treeContract.connect(whale).upgradeTree(1, 30)).to.not.reverted;
    });

    it(' - Should downgrade tree if green donation', async () => {
      const { treeContract, whale, owner, ETH } = await loadFixture(fetchFixtures)
      await treeContract.mint('', '', 0, Date.now());
      await expect(treeContract.connect(owner).setGreenDonationContract(whale.address)).to.not.reverted;
      await expect(treeContract.connect(whale).upgradeTree(1, 25)).to.not.reverted;
      await expect(treeContract.connect(whale).downgradeTree(1, ETH.mul(6))).to.revertedWith('');
    });

    it(' - Should not upgrade tree if not green donation', async () => {
      const { treeContract, whale, owner, ETH } = await loadFixture(fetchFixtures)
      await treeContract.mint('', '', 0, Date.now());
      expect((await treeContract.trees(1)).level).to.eq(0)
      await expect(treeContract.connect(whale).upgradeTree(1, 15)).revertedWith('Only green donation contract can call this function');
      expect((await treeContract.trees(1)).level).to.eq(0)
    });

    it(' - Should not downgrade tree if not green donation', async () => {
      const { treeContract, whale, owner, ETH } = await loadFixture(fetchFixtures)
      await treeContract.mint('', '', 0, Date.now());
      expect((await treeContract.trees(1)).level).to.eq(0)
      await expect(treeContract.connect(whale).downgradeTree(1, ETH.mul(6))).rejectedWith('Only green donation contract can call this function')
      expect((await treeContract.trees(1)).level).to.eq(0)
    });
  });

  describe('- Mint', async () => {
    it(' - Should mint 1 token', async () => {
      const { treeContract, owner, retirementCertificateEscrow, provider } = await loadFixture(fetchFixtures)
      await treeContract.mint('', '', 0, Date.now())
      expect(await treeContract.balanceOf(owner.address)).to.eq(1)
      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(1)
    });

    // it(' - Should mint 10 token', async () => {
    //   const { treeContract, owner, retirementCertificateEscrow} = await loadFixture(fetchFixtures)
    //   await treeContract.mint(10, '', '')
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(10)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[0][0].claimed).eq(false)
    //   expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
    //   expect(userRetirementCertificate[0][0].tree).eq(1)
    //   expect(userRetirementCertificate[1]).eq(1)
    // });

    it(' - Should mint 1 token properly when cost is 1 ETH', async () => {
      const { treeContract, owner, ETH, weth} = await loadFixture(fetchFixtures)
      await expect(treeContract.setCost(ETH)).to.not.reverted;

      await expect(treeContract.mint('', '', 0, Date.now(), { value: ETH })).to.not.reverted
      expect(await treeContract.balanceOf(owner.address)).to.eq(1)
    });

    // it(' - Should mint 8 token properly when cost is 1 ETH', async () => {
    //   const { treeContract, owner, weth, ETH, retirementCertificateEscrow} = await loadFixture(fetchFixtures)
    //   await expect(treeContract.setCost(ETH)).to.not.reverted;

    //   await expect(treeContract.mint(8, '', '', { value: ETH.mul(8) })).to.not.reverted
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(8)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[0][0].claimed).eq(false)
    //   expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
    //   expect(userRetirementCertificate[0][0].tree).eq(1)
    //   expect(userRetirementCertificate[1]).eq(1)
    // });

    // it(' - Should not mint 8 token properly when cost is 1 ETH but less is sent', async () => {
    //   const { treeContract, owner, provider, ETH, retirementCertificateEscrow} = await loadFixture(fetchFixtures)
    //   await expect(treeContract.setCost(ETH)).to.not.reverted;

    //   await expect(treeContract.mint(8, '', '', { value: ETH.mul(7) })).to.reverted
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(0)
    //   expect(await provider.getBalance(treeContract.address)).to.eq(0)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[1]).eq(0)
    // });

    it(' - Should not mint 1 token properly when cost is 1 ETH and less amount is sent', async () => {
      const { treeContract, owner, provider, ETH, HALF_ETH, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await expect(treeContract.setCost(ETH)).to.not.reverted;

      await expect(treeContract.mint('', '', 0, Date.now(), { value: HALF_ETH })).to.revertedWith('Incorrect value sent')
      expect(await treeContract.balanceOf(owner.address)).to.eq(0)
      expect(await provider.getBalance(treeContract.address)).to.eq(0)
      const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[1]).eq(0)
    });

    // it(' - Should not mint 2 token properly when cost is 1 ETH and less amount is sent', async () => {
    //   const { treeContract, owner, provider, ETH, HALF_ETH , retirementCertificateEscrow } = await loadFixture(fetchFixtures)
    //   await expect(treeContract.setCost(ETH)).to.not.reverted;

    //   await expect(treeContract.mint(2, '', '', { value: HALF_ETH })).to.revertedWith('Incorrect value sent')
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(0)
    //   expect(await provider.getBalance(treeContract.address)).to.eq(0)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[1]).eq(0)
    // });

    // it(' - Should mint 10 token through out', async () => {
    //   const { treeContract, owner, provider, ETH, HALF_ETH, retirementCertificateEscrow} = await loadFixture(fetchFixtures)
    //   await expect(treeContract.mint(2, '', '')).to.not.reverted;
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(2)
    //   await expect(treeContract.mint(8, '', '')).to.not.reverted;
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(10)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[0][0].claimed).eq(false)
    //   expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
    //   expect(userRetirementCertificate[0][0].tree).eq(1)
    //   expect(userRetirementCertificate[1]).eq(1)
    // });

    // it(' - Should mint 10 token at once', async () => {
    //   const { treeContract, owner, provider, ETH, HALF_ETH, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
    //   await expect(treeContract.mint(10, '', '')).to.not.reverted;
    //   expect(await treeContract.balanceOf(owner.address)).to.eq(10)
    //   const userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
    //   expect(userRetirementCertificate[0][0].claimed).eq(false)
    //   expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
    //   expect(userRetirementCertificate[0][0].tree).eq(1)
    //   expect(userRetirementCertificate[1]).eq(1)
    // });

    it(' - Should not mint more than 10 token through out', async () => {
      const { treeContract, owner, provider, ETH, HALF_ETH, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await expect(treeContract.mint('', '', 0, Date.now())).to.not.reverted;
      expect(await treeContract.balanceOf(owner.address)).to.eq(1)
      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(1);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(1)

      await expect(treeContract.mint('', '', 0, Date.now())).to.revertedWith('Exceed max mintable amount')
      expect(await treeContract.balanceOf(owner.address)).to.eq(1)
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tree).eq(1)
      expect(userRetirementCertificate[1]).eq(1)
    });
  });
});