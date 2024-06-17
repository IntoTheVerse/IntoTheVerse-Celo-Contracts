async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const RetirementCertificateEscrow = await ethers.getContractFactory("RetirementCertificateEscrow");
  const retirementCertificateEscrow = await RetirementCertificateEscrow.deploy();

  console.log("RetirementCertificateEscrow deployed to:", retirementCertificateEscrow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});

// Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
// RetirementCertificateEscrow deployed to: 0x54805Dd1B7c444D3073E3078E56D8d02A31405D0