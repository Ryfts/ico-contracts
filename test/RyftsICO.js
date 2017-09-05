var Contract = artifacts.require("./RyftsICO.sol");

var Utils = require("./utils");

var BigNumber = require('bignumber.js');
var precision = new BigNumber("1000000000000000000");

/*
 + create contract & check token info
 - transfer tokens, add reward, transfer tokens, claim, balance should equal zero
 - transfer tokens, add reward with 1 sec recycle, transfer tokens, timeout for 5 sec, balance should equal zero
 */

contract('Contract', function (accounts) {
    it("create contract & check token info", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        return Contract.new(
            new BigNumber("333333333333333"),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("270000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            false
        ).then(function (_instance) {
            instance = _instance;
        })
            .then(() => instance.standard.call())
            .then((result) => assert.equal(result.valueOf(), "Ryfts 0.1", "standard is not equal"))
            .then(() => instance.name.call())
            .then((result) => assert.equal(result.valueOf(), "Ryfts", "token name is not equal"))
            .then(() => instance.symbol.call())
            .then((result) => assert.equal(result.valueOf(), "RFT", "token symbol is not equal"))
            .then(() => instance.decimals.call())
            .then((result) => assert.equal(result.valueOf(), 8, "precision is not equal"))
            .then(() => instance.totalSupply.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber("3300000000000000"), "total supply is not equal"))
            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))
            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), icoSince, "preIcoSince is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), icoTill, "preIcoSince is not equal"))
            .then(() => instance.minIcoGoalTokens.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber("270000000000000"), "minIcoGoalTokens is not equal"))
            .then(() => instance.tokenPrice.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber("333333333333333"), "tokenPrice is not equal"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("2970000000000000").valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[7], new BigNumber("330000000000000").valueOf()));
    });

    it("create contract, buy tokens, get balance", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("1000"),
            new BigNumber("30000000"),
            "Ryfts",
            "RFT",
            false
        ).then(function (_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("27000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(function () {
                return Utils.receiptShouldSucceed;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 26996250))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 3750))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1", "collected amount is not equal");
            })
    });

    it("should  not be able to buy tokens before ICO", function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 + 3600 * 8;  // 8 hours in future
        var icoTill = new Date().getTime() / 1000 + 3600 * 10;  // 10 hours in future

        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("1000"),
            new BigNumber("30000000"),
            "Ryfts",
            "RFT",
            false
        ).then(function (_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("27000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "0", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "27000000"))
    });

    it("should  not be able to buy tokens after preICO", function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 - 3600 * 8;
        var icoTill = new Date().getTime() / 1000 - 3600 * 10;

        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("1000"),
            new BigNumber("30000000"),
            "Ryfts",
            "RFT",
            false
        ).then(function (_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("27000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "0", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "27000000"))
    });

    it("should  not be able to buy tokens if contract is locked", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("1000"),
            new BigNumber("30000000"),
            "Ryfts",
            "RFT",
            true
        ).then(function (_instance) {
            instance = _instance;
        })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("27000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "0", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "27000000"))
    });

    it("should be able to buy tokens, change token price", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds= 0;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
            accounts[7],
            icoSince,
            icoTill,
            new BigNumber("1000"),
            new BigNumber("30000000"),
            "Ryfts",
            "RFT",
            false
        )
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("27000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(function () {
                return Utils.receiptShouldSucceed;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 3750))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "26996250"))
            .then(function () {
                return instance.setTokenPrice(new BigNumber("40000"));
            })
            .then(Utils.receiptShouldSucceed)
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 6875))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "26993125"))
    });

    it("test different bonus amouns", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds= 0;

        var now = new Date().getTime() / 1000 + 10;
        var after3Hours = now + 3600 * 3 + 500;
        var after6Hours = now + 3600 * 6 + 500;
        var after9Hours = now + 3600 * 9 + 500;

        return Contract.new(
                new BigNumber("0.000333333").mul(100000000),
                accounts[7],
                icoSince,
                icoTill,
                new BigNumber("1000"),
                new BigNumber("30000000"),
                "Ryfts",
                "RFT",
                false
            )
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => instance.getBonusAmount.call(now, 3000))
            .then((result) => assert.equal(result.valueOf(), 750, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(now, 100000000))
            .then((result) => assert.equal(result.valueOf(), 25000000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(now, 9900908900))
            .then((result) => assert.equal(result.valueOf(), 2475227225, "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after3Hours, 3000))
            .then((result) => assert.equal(result.valueOf(), 450, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after3Hours, 15000000))
            .then((result) => assert.equal(result.valueOf(), 2250000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after3Hours, 9900908900))
            .then((result) => assert.equal(result.valueOf(), 1485136335, "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after6Hours, 3000))
            .then((result) => assert.equal(result.valueOf(), 150, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after6Hours, 100000000))
            .then((result) => assert.equal(result.valueOf(), 5000000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after6Hours, 9900908900))
            .then((result) => assert.equal(result.valueOf(), 495045445, "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after9Hours, 3000))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after9Hours, 100000000))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after9Hours, 9900908900))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
    });

    it("buy tokens for 1 ether", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;
        return Contract.new(
                new BigNumber("333333333333333"),
                accounts[7],
                icoSince,
                icoTill,
                new BigNumber("1000"),
                new BigNumber("3300000000000000"),
                "Ryfts",
                "RFT",
                false
            )
            .then(function (_instance) {
                instance = _instance;
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("2970000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000"});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2969625000000000"))
    });
});