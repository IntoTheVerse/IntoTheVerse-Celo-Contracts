async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    const TreeContract = await ethers.getContractFactory("TreeContract");
    const baseURI = "https://x.com/IntoTheVerse_";
    const tc02Address = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1"; // Replace with the actual address
    const wrappedNativeTokenAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; // Replace with CELO alfajores address
    const retirementCertificatesAddress = "0xd4DE140b1064A40a00cD756Ab812181e7e14DA04"; // Replace with the actual address
    const swapRouterAddress = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121"; // Replace with the ubeswap router
  
    const treeContract = await TreeContract.deploy(
      baseURI,
      tc02Address,
      wrappedNativeTokenAddress,
      retirementCertificatesAddress,
      swapRouterAddress
    );
  
    console.log("TreeContract deployed to:", treeContract.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

    // Deploying contracts with the account: 0xbE8Ace29e3022CD6841821315F82a6C2484fE585
    // TreeContract deployed to: 0xa70cAEA5F5BaCe80B0ab9FB1A2F9d94C31aEe94d