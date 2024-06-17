const hre = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
  
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
  
    console.log("Token deployed to:", token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
// Token deployed to: 0xB20f3CAE3Dad0b59b04AF54dCB786A1d1fD1b67b