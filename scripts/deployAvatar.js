// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", balance.toString());


  // Set your baseURI here
  const baseURI = "https://x.com/MetaBoomtown";

  const Avatar = await hre.ethers.getContractFactory("Avatar");
  const avatar = await Avatar.deploy(baseURI);
  await avatar.deployed();
  console.log("Avatar contract deployed to:", avatar.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


// const path = require("path");

// async function main() {
//   // This is just a convenience check
//   if (network.name === "hardhat") {
//     console.warn(
//       "You are trying to deploy a contract to the Hardhat Network, which" +
//       "gets automatically created and destroyed every time. Use the Hardhat" +
//       " option '--network localhost'"
//     );
//   }

//   // ethers is available in the global scope
//   const [deployer] = await ethers.getSigners();
//   console.log(
//     "Deploying the contracts with the account:",
//     await deployer.getAddress()
//   );

//   console.log("Account balance:", (await deployer.getBalance()).toString());

//   const Avatar = await ethers.getContractFactory("Avatar");
//   const avatar = await Avatar.deploy("YOUR_BASE_URI");
//   await avatar.deployed();

//   console.log("Avatar address:", avatar.address);

//   // We also save the contract's artifacts and address in the frontend directory
//   saveFrontendFiles(avatar);
// }

// function saveFrontendFiles(avatar) {
//   const fs = require("fs");
//   const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

//   if (!fs.existsSync(contractsDir)) {
//     fs.mkdirSync(contractsDir);
//   }

//   fs.writeFileSync(
//     path.join(contractsDir, "contract-address.json"),
//     JSON.stringify({ Avatar: avatar.address }, undefined, 2)
//   );

//   const AvatarArtifact = artifacts.readArtifactSync("Avatar");

//   fs.writeFileSync(
//     path.join(contractsDir, "Avatar.json"),
//     JSON.stringify(AvatarArtifact, null, 2)
//   );
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });