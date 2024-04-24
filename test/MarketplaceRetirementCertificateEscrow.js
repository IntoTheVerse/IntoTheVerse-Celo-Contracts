const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('MarketplaceRetirementCertificateEscrow contract', () => {
  async function fetchFixtures() {
    const DAY = 24 * 60 * 60;
    const ETH = ethers.utils.parseEther('1');
    const HALF_ETH = ETH.mul(50).div(100);

    const provider = ethers.provider;
    const [owner, whale, whale2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory('MockNFT');
    const TC02 = await ethers.getContractFactory('MockTC02');
    const WETH = await ethers.getContractFactory('MockERC20');
    const Marketplace = await ethers.getContractFactory('NftMarketplace');
    const SwapRouter = await ethers.getContractFactory('MockUniswapV2Router');
    const RetirementCertificate = await ethers.getContractFactory('MockRetirementCertificate');
    const RetirementCertificateEscrow = await ethers.getContractFactory('MarketplaceRetirementCertificateEscrow');

    const swapRouter = await SwapRouter.deploy();
    const nftA = await NFT.deploy('NFTA', 'NFTA');
    const nftB = await NFT.deploy('NFTB', 'NFTB');
    const weth = await WETH.deploy('WETH', 'WETH');
    const tc02 = await TC02.deploy('Toucan protocol token', 'TC02');
    const retirementCertificateEscrow = await RetirementCertificateEscrow.deploy();
    const retirementCertificate = await RetirementCertificate.deploy('Retirement Certificate', 'R Cert');
    const marketplace = await Marketplace.deploy(
        swapRouter.address, 
        tc02.address, 
        retirementCertificate.address, 
        retirementCertificateEscrow.address, 
        weth.address
    );
    
    await retirementCertificateEscrow.setNFTMarketplace(marketplace.address)
    await retirementCertificateEscrow.setRetirementCertificate(retirementCertificate.address)

    return { provider, ethers, DAY, ETH, HALF_ETH, owner, whale, whale2, TC02, SwapRouter, RetirementCertificate, RetirementCertificateEscrow , swapRouter, tc02, retirementCertificate, retirementCertificateEscrow, marketplace, nftA, nftB, weth, };
  }

  describe('- Access restricted functions', async () => {
    it(' - Should setNFTMarketplace if owner', async () => {
      const { whale, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      expect(await retirementCertificateEscrow.setNFTMarketplace(whale.address)).to.not.reverted;
      expect(await retirementCertificateEscrow.nftMarketplace()).to.eq(whale.address);
    });

    it(' - Should not setNFTMarketplace if not owner', async () => {
      const { marketplace, retirementCertificateEscrow, whale, whale2,  } = await loadFixture(fetchFixtures)
      await expect(retirementCertificateEscrow.connect(whale).setNFTMarketplace(whale2.address)).to.reverted;
      expect(await retirementCertificateEscrow.nftMarketplace()).to.eq(marketplace.address);
    });

    it(' - Should setRetirementCertificate if owner', async () => {
      const { retirementCertificateEscrow, whale } = await loadFixture(fetchFixtures)
      expect(await retirementCertificateEscrow.setRetirementCertificate(whale.address)).to.not.reverted;
      expect(await retirementCertificateEscrow.retirementCertificate()).to.eq(whale.address);
    });

    it(' - Should not setRetirementCertificate if not owner', async () => {
      const { retirementCertificate, retirementCertificateEscrow, whale, whale2 } = await loadFixture(fetchFixtures)
      await expect(retirementCertificateEscrow.connect(whale).setRetirementCertificate(whale2.address)).to.reverted;
      expect(await retirementCertificateEscrow.retirementCertificate()).to.eq(retirementCertificate.address);
    });
  });

  describe('- Claim Retirement Certificate', async () => {
    it(' - Should claim retirement certificate from buying NFT on marketplace', async () => {
      const tokenId = 1
      const { nftA, marketplace, whale, owner, ETH, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
    
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      await marketplace.connect(owner).toggleNftWhitelistValue(nftA.address)

      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH})).to.not.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
      expect(await nftA.ownerOf(tokenId)).to.eq(whale.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(ETH.mul(90).div(100))
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)

      await expect(retirementCertificateEscrow.connect(whale).claimRetirementCertificate(nftA.address, tokenId, [0])).to.not.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(whale.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(whale.address)
    });

    it(' - Should not claim retirement certificate from buying NFT on marketplace if not NFT current owner', async () => {
      const tokenId = 1
      const { nftA, marketplace, whale2, whale, owner, ETH, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
    
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      await marketplace.connect(owner).toggleNftWhitelistValue(nftA.address)

      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH})).to.not.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
      expect(await nftA.ownerOf(tokenId)).to.eq(whale.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(ETH.mul(90).div(100))
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)

      await expect(retirementCertificateEscrow.connect(whale2).claimRetirementCertificate(nftA.address, tokenId, [0])).to.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)
    });

    it(' - Should not affect other certificates when claimed 1 ceritificate', async () => {
      const tokenId = 1
      const tokenId2 = 2
      const { nftA, marketplace, whale, owner, ETH, retirementCertificateEscrow, retirementCertificate } = await loadFixture(fetchFixtures)
    
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId2)
      await marketplace.connect(owner).toggleNftWhitelistValue(nftA.address)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      await expect(marketplace.listItem(nftA.address, tokenId2, ETH)).to.not.reverted;

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH})).to.not.reverted;
      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId2, '', '', { value: ETH})).to.not.reverted;

      let userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(false)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(2)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)
      
      let userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[0][0].tokenId).eq(2)
      expect(userRetirementCertificate2[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate2[0][0].index).eq(0)
      expect(userRetirementCertificate2[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(2)
      expect(await retirementCertificate.ownerOf(2)).to.eq(marketplace.address)

      await expect(retirementCertificateEscrow.connect(whale).claimRetirementCertificate(nftA.address, tokenId, [0])).to.not.reverted;
      userRetirementCertificate = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId);
      expect(userRetirementCertificate[0][0].claimed).eq(true)
      expect(userRetirementCertificate[0][0].retirementCertificate).eq(1)
      expect(userRetirementCertificate[0][0].tokenId).eq(1)
      expect(userRetirementCertificate[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate[0][0].index).eq(0)
      expect(userRetirementCertificate[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.balanceOf(whale.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(whale.address)
      expect(await retirementCertificate.ownerOf(2)).to.eq(marketplace.address)

      userRetirementCertificate2 = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId2);
      expect(userRetirementCertificate2[0][0].claimed).eq(false)
      expect(userRetirementCertificate2[0][0].retirementCertificate).eq(2)
      expect(userRetirementCertificate2[0][0].tokenId).eq(2)
      expect(userRetirementCertificate2[0][0].nftAddress).eq(nftA.address)
      expect(userRetirementCertificate2[0][0].index).eq(0)
      expect(userRetirementCertificate2[1]).eq(1)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.balanceOf(whale.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(whale.address)
      expect(await retirementCertificate.ownerOf(2)).to.eq(marketplace.address)
    });
  });
});