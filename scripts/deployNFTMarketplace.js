async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const NftMarketplace = await ethers.getContractFactory("NftMarketplace");
  const swapRouter = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121"; // Replace with the actual address
  const tc02 = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"; // Replace with the actual address
  const retirementCertificate = "0xd4DE140b1064A40a00cD756Ab812181e7e14DA04"; // Replace with the actual address
  const retirementCertificateEscrow = "0x54805Dd1B7c444D3073E3078E56D8d02A31405D0"; // Replace with the actual address
  const wrappedNativeToken = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // Replace with the actual address

  const nftMarketplace = await NftMarketplace.deploy(
    swapRouter,
    tc02,
    retirementCertificate,
    retirementCertificateEscrow,
    wrappedNativeToken
  );

  console.log("NftMarketplace deployed to:", nftMarketplace.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});

// Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
// NftMarketplace deployed to: 0xD0bf240628639595C25d2a624b959201E0de5d20
