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
};
