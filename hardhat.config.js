require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.4.18" },
      { version: "0.5.1" },
      { version: "0.5.16" },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000
          }
        }
      },
      { version: "0.7.6" },
      { version: "0.8.0" },
      { version: "0.8.9" },
      { version: "0.8.17" },
      { version: "0.8.20" }
    ]
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`, // Replace with your Infura API key
      accounts: [process.env.PRIVATE_KEY]
    },
    alfajores: {
     url: "https://alfajores-forno.celo-testnet.org",
     accounts: [process.env.PRIVATE_KEY],
     chainId: 44787
   }
  },
};

task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
