var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = '';
var infuraToken = '';

if (mnemonic !== '') {
  throw new Error("Enter mnemonic");
}

if (infuraToken !== '') {
  throw new Error("Enter infura token credentials");
}

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gasPrice: 1,
      gas: 4700000,
    },

    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infuraToken);
      },
      network_id: 3
    }
  }
};
