const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", balance.toString());

  const rewardsDistribution = "0xbE8Ace29e3022CD6841821315F82a6C2484fE585"; // Replace with actual address
  // const rewardsToken = "0xB20f3CAE3Dad0b59b04AF54dCB786A1d1fD1b67b"; // Replace with custom token address
  const rewardsToken = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"; // Replace with cUSD address
  const stakingToken = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // Replace with actual address CELO token
  const rewardsDuration = 60 * 60 * 24 * 7; // 1 week in seconds
  const swapRouter = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121"; // Replace with ubeswap
  // const tc02 = "0xB297F730E741a822a426c737eCD0F7877A9a2c22"; // Replace with actual address
  const tc02 = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1";
  const retirementCertificate = "0xd4DE140b1064A40a00cD756Ab812181e7e14DA04"; // Replace with actual address
  const treeContract = "0xa70cAEA5F5BaCe80B0ab9FB1A2F9d94C31aEe94d"; // Replace with actual address
  const retirementCertificateEscrow = "0x54805Dd1B7c444D3073E3078E56D8d02A31405D0"; // Replace with actual address

  const GreenDonation = await ethers.getContractFactory("GreenDonation");
  const greenDonation = await GreenDonation.deploy(
    rewardsDistribution,
    rewardsToken,
    stakingToken,
    rewardsDuration,
    swapRouter,
    tc02,
    retirementCertificate,
    treeContract,
    retirementCertificateEscrow
  );

  await greenDonation.deployed();
  console.log("GreenDonation contract deployed to:", greenDonation.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
// Account balance: 1116211940000000000
// GreenDonation contract deployed to: 0xf5279d98AE342BedfD874667CF6c725C6AF2DC6A