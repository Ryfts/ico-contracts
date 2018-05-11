var RyftsICO = artifacts.require("./Ryfts.sol");
var BigNumber = require('bignumber.js');

module.exports = function(deployer) {
  deployer.deploy(
      RyftsICO,
      0, // reserve account address
      new BigNumber("300000000000000").mul(100000000),
      new BigNumber("3300000000000000").mul(100000000),
      "Ryfts",
      "RFT",
      0,  // multivest address
      false
  );
};
