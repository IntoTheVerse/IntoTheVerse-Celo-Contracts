async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    const MarketplaceRetirementCertificateEscrow = await ethers.getContractFactory("MarketplaceRetirementCertificateEscrow");
    const marketplaceRetirementCertificateEscrow = await MarketplaceRetirementCertificateEscrow.deploy();
  
    console.log("MarketplaceRetirementCertificateEscrow deployed to:", marketplaceRetirementCertificateEscrow.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
});


// Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
// MarketplaceRetirementCertificateEscrow deployed to: 0x52b5dd92C4C6bC29e5B512e15631F13C653d4560