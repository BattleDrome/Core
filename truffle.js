module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  mocha: {
    slow: 5000,
  },
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      host: "10.5.0.200",
      port: 8545,
      network_id: "4" 
    }
  }
};