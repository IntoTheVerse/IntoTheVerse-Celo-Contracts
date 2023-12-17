const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
      "gets automatically created and destroyed every time. Use the Hardhat" +
      " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Avatar = await ethers.getContractFactory("Avatar");
  const avatar = await Avatar.deploy("YOUR_BASE_URI");
  await avatar.deployed();

  console.log("Avatar address:", avatar.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(avatar);
}

function saveFrontendFiles(avatar) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Avatar: avatar.address }, undefined, 2)
  );

  const AvatarArtifact = artifacts.readArtifactSync("Avatar");

  fs.writeFileSync(
    path.join(contractsDir, "Avatar.json"),
    JSON.stringify(AvatarArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });