var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = process.env.TRUFFLE_WALLET_MNEMONIC;
if (mnemonic == null) mnemonic = "RANDOM WALLET MNEMONIC GOES HERE"

module.exports = {
  contracts_build_directory: "./src/contracts",
  compilers: {
    solc: {
      version: "0.5.11",
      settings: {
        optimizer: {
          enabled: true,
          runs: 5
        },
        evmVersion: "constantinople"
      }
    }
  },
  mocha: {
    useColors: true,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 5
    }
  },
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*",      //Any Network
      gas: 7400000,         //7M Gas Limit
      gasPrice: 5000000000, //5GWei gas price
      skipDryRun: true
    },
    debug: {
      host: "localhost",
      port: 9545,
      network_id: "*",      //Any Network
      gas: 7400000,         //7M Gas Limit
      gasPrice: 5000000000, //5GWei gas price
      skipDryRun: true
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/[YOUR_PROJECT_ID_HERE]");
      },
      network_id: "4",
      gas: 7400000,         //7M Gas Limit
      gasPrice: 10000000000, //10GWei gas price for faster deployment
      timeoutBlocks: 200, //Allow long timeout for deployment
      skipDryRun: false
    }
  }
};