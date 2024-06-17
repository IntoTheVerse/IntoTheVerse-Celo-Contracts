require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: `0.8.21`,
        settings: {
          optimizer: {
            enabled: true,
            runs: 15000
          },
          evmVersion: `paris`
        }
      },
    ],
  },
    networks: {
        alfajores: {
            url: "https://alfajores-forno.celo-testnet.org",
            accounts: [process.env.PRIVATE_KEY],
        },
        celo: {
            url: "https://forno.celo.org",
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    etherscan: {
        apiKey: {
            alfajores: process.env.CELOSCAN_API_KEY,
            celo: process.env.CELOSCAN_API_KEY,
        },
        customChains: [
            {
                network: "alfajores",
                chainId: 44787,
                urls: {
                    apiURL: "https://api-alfajores.celoscan.io/api",
                    browserURL: "https://alfajores.celoscan.io",
                },
            },
            {
                network: "celo",
                chainId: 42220,
                urls: {
                    apiURL: "https://api.celoscan.io/api",
                    browserURL: "https://celoscan.io/",
                },
            },
        ],
    },
};

// require('dotenv').config();
// require("@nomicfoundation/hardhat-toolbox");

// // The next line is part of the sample project, you don't need it in your
// // project. It imports a Hardhat task definition, that can be used for
// // testing the frontend.
// require("./tasks/faucet");


// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: {
//     compilers: [
//       {
//         version: `0.8.21`,
//         settings: {
//           optimizer: {
//             enabled: true,
//             runs: 15000
//           },
//           evmVersion: `paris`
//         }
//       },
//     ],
//   },
//   networks: {
//     alfajores: {
//       url: "https://alfajores-forno.celo-testnet.org",
//       accounts: [`0x${process.env.PRIVATE_KEY}`],
//     },
//   },
// };

// task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
//   const accounts = await ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// // module.exports = {
// //   solidity: "0.8.0",
// //   networks: {
// //     alfajores: {
// //       url: "https://alfajores-forno.celo-testnet.org",
// //       accounts: [`0x${process.env.PRIVATE_KEY}`],
// //     },
// //   },
// // };
