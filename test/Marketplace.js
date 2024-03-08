const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('Marketplace contract', () => {
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
    it(' - Should setRedemptionRate if owner', async () => {
      const { marketplace, ETH } = await loadFixture(fetchFixtures)
      expect(await marketplace.setRedemptionRate(ETH)).to.not.reverted;
      expect(await marketplace.redemptionRate()).to.eq(ETH);

       expect(await marketplace.setRedemptionRate(ETH.mul(100))).to.not.reverted;
      expect(await marketplace.redemptionRate()).to.eq(ETH.mul(100));
    });

    it(' - Should not setRedemptionRate if not owner', async () => {
      const { marketplace, ETH, whale } = await loadFixture(fetchFixtures)
      await expect(marketplace.connect(whale).setRedemptionRate(ETH)).to.reverted;
      expect(await marketplace.redemptionRate()).to.eq(10);
    });

    it(' - Should setSwapRouter if owner', async () => {
      const { marketplace, whale } = await loadFixture(fetchFixtures)
      expect(await marketplace.setSwapRouter(whale.address)).to.not.reverted;
      expect(await marketplace.swapRouter()).to.eq(whale.address);
    });

    it(' - Should not setSwapRouter if not owner', async () => {
      const { marketplace, whale, whale2, swapRouter } = await loadFixture(fetchFixtures)
      await expect(marketplace.connect(whale).setSwapRouter(whale2.address)).to.reverted;
      expect(await marketplace.swapRouter()).to.eq(swapRouter.address);
    });

    it(' - Should setRetirementCertificateEscrow if owner', async () => {
      const { marketplace, whale2 } = await loadFixture(fetchFixtures)
      expect(await marketplace.setRetirementCertificateEscrow(whale2.address)).to.not.reverted;
      expect(await marketplace.retirementCertificateEscrow()).to.eq(whale2.address);
    });

    it(' - Should not setRetirementCertificateEscrow if not owner', async () => {
      const { marketplace, whale, whale2, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await expect(marketplace.connect(whale).setRetirementCertificateEscrow(whale2.address)).to.reverted;
      expect(await marketplace.retirementCertificateEscrow()).to.eq(retirementCertificateEscrow.address);
    });
  });

  describe('- List Item', async () => {
    it(' - Should listItem', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      const listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
    });

    it(' - Should not listItem if already listed', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      const listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.reverted;
    });

    it(' - Should not listItem if not nft owner', async () => {
      const tokenId = 1
      const { marketplace, whale, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.connect(whale).listItem(nftA.address, tokenId, ETH)).to.reverted;
      const listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });

    it(' - Should not listItem if price <= 0', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, 0)).to.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });

    it(' - Should not listItem if NFT not approved', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      
      await expect(marketplace.listItem(nftA.address, tokenId, 0)).to.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });
  });

  describe('- Cancel Listing', async () => {
    it(' - Should cancelListing', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)

      await expect(marketplace.cancelListing(nftA.address, tokenId)).to.not.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });

    it(' - Should not cancelListing if not owner', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)

      await expect(marketplace.connect(whale).cancelListing(nftA.address, tokenId)).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
    });

    it(' - Should not cancelListing if not listed', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.cancelListing(nftA.address, tokenId)).to.reverted;
      const listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });
  });

  describe('- Update Listing', async () => {
    it(' - Should updateListing', async () => {
      const tokenId = 1
      const { marketplace, ETH, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)

      await expect(marketplace.updateListing(nftA.address, tokenId, ETH.mul(2))).to.not.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH.mul(2))
    });

    it(' - Should not updateListing if not owner', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)

      await expect(marketplace.connect(whale).updateListing(nftA.address, tokenId, ETH.mul(2))).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
    });

    it(' - Should not cancelListing if not listed', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.updateListing(nftA.address, tokenId, ETH.mul(2))).to.reverted;
      const listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
    });

    it(' - Should not cancelListing if newPrice = 0', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
        
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)

      await expect(marketplace.updateListing(nftA.address, tokenId, 0)).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
    });
  });

  describe('- Buy Item', async () => {
    it(' - Should buyItem', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner, provider, retirementCertificate } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
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
    });

    it(' - Should reflect buyItem state in MarketplaceRetirementCertificateEscrow', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner, retirementCertificate, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
      
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH })).to.not.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
      expect(await nftA.ownerOf(tokenId)).to.eq(whale.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(ETH.mul(90).div(100))
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)
      const userCertificates = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId)
      expect(userCertificates[1]).to.eq(1)
      expect(userCertificates[0][0].tokenId).to.eq(1)
      expect(userCertificates[0][0].retirementCertificate).to.eq(1)
      expect(userCertificates[0][0].claimed).to.eq(false)
      expect(userCertificates[0][0].index).to.eq(0)
      expect(userCertificates[0][0].nftAddress).to.eq(nftA.address)
      expect(await nftA.ownerOf(tokenId)).to.eq(whale.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(ETH.mul(90).div(100))
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(1)
      expect(await retirementCertificate.ownerOf(1)).to.eq(marketplace.address)
    });

    it(' - Should not buyItem if not listed', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner, provider, retirementCertificate } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
        
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH})).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(ZERO_ADDRESS)
      expect(listing.price).to.eq(0)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
    });

    it(' - Should not buyItem if not value < price', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner, provider, retirementCertificate, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
        
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '', { value: ETH.mul(99).div(100)})).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
      const userCertificates = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId)
      expect(userCertificates[1]).to.eq(0)
      expect(userCertificates[0].length).to.eq(0)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
    });

    it(' - Should not buyItem if not value == 0', async () => {
      const tokenId = 1
      const { marketplace, ETH, whale, nftA, owner, provider, retirementCertificate, retirementCertificateEscrow } = await loadFixture(fetchFixtures)
      await nftA.mint(owner.address)
      await nftA.approve(marketplace.address, tokenId)
        
      await expect(marketplace.listItem(nftA.address, tokenId, ETH)).to.not.reverted;
      let listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)

      await expect(marketplace.connect(whale).buyItem(nftA.address, tokenId, '', '')).to.reverted;
      listing = await marketplace.getListing(nftA.address, tokenId);
      expect(listing.seller).to.eq(owner.address)
      expect(listing.price).to.eq(ETH)
      expect(await nftA.ownerOf(tokenId)).to.eq(owner.address)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
      const userCertificates = await retirementCertificateEscrow.getUserRetirementCertificates(nftA.address, tokenId)
      expect(userCertificates[1]).to.eq(0)
      expect(userCertificates[0].length).to.eq(0)
      expect(await marketplace.getProceeds(owner.address)).to.eq(0)
      expect(await provider.getBalance(marketplace.address)).to.eq(0)
      expect(await retirementCertificate.balanceOf(marketplace.address)).to.eq(0)
    });
  });
});