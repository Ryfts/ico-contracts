var ERC20 = artifacts.require("./Token.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');


/*
    + deploy & check for total supply & balance of smart contract & sender
    + transfer with disabled transfer
    + transfer with enabled transfer
    - transfer from with disabled transfer
    - transfer from with enabled transfer
*/

contract('Token', function(accounts) {

    it("deploy & check for total supply & balance of smart contract & sender", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            false,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 0));
    });

    it("transfer", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
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

    it("approve, transfer by transferFrom", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.approve(accounts[1], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 1000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom.call(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(function(result) {
                assert.equal(result.valueOf(), true, "transferFrom failed");
            })
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 1000, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 0, "allowance is not equal");
            });
    });

    it("approve, transferFrom more than exists", function() {
        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.approve(accounts[1], 2000000);
            })
            .catch(Utils.catchReceiptShouldFailed)
            .then(function() {
                return instance.approve(accounts[1], 1000);
            })
            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 1000, "allowance is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom.call(accounts[0], accounts[1], 1001, {from: accounts[1]});
            })
            .catch(Utils.catchReceiptShouldFailed);
    });

    it("try to transfer tokens to itself", function() {
        "use strict";

        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[0], 1000);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

    it("try to transfer 0 tokens", function() {
        "use strict";

        var instance;

        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
            .then(function() {
                return instance.transfer(accounts[1], 0);
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
    });

    it("transfer by transferFrom with lock == false", function() {
        return ERC20.new(
            1000000,
            "TEST",
            18,
            "TEST",
            true,
        ).then(function(_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))

            .then(function() {
                return instance.approve(accounts[1], 2000000);
            })
            .then(Utils.receiptShouldSucceed)

            .then(function() {
                return instance.allowance.call(accounts[0], accounts[1]);
            })
            .then(function(result) {
                assert.equal(result.valueOf(), 2000000, "allowance is not equal");
            })

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
            .then(function() {
                return instance.transferFrom(accounts[0], accounts[1], 500000, {from: accounts[1]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 500000))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 500000))
    });

});