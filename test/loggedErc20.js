var LoggedERC20 = artifacts.require("./LoggedERC20.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');


/*
    + deploy & check for total supply & balance of smart contract & sender
    + transfer with disabled transfer
    + transfer with enabled transfer
    - transfer from with disabled transfer
    - transfer from with enabled transfer
*/

contract('LoggedERC20', function(accounts) {
    it("deploy & check for total supply & balance of smart contract & sender", function() {
        var instance;

        return LoggedERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            false,
            true
        ).then(function(_instance) {
            instance = _instance;
        })
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0));
    });

    it("transfer with enabled lock", function() {
        var instance;

        return LoggedERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                true
            ).then(function(_instance) {
                instance = _instance;
            })
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

    it("transfer with disabled lock", function() {
        var instance;

        return LoggedERC20.new(
                1000000,
                "TEST",
                18,
                "TEST",
                true,
                false
            ).then(function(_instance) {
                instance = _instance;
            })
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
        .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(function() {
            return instance.transfer(accounts[1], 1000);
        })
        .then(Utils.receiptShouldSucceed)
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 996000))
        .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 4000));
    });
});