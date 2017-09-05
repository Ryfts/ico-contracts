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
            new BigNumber("3000"),
            icoSince,
            icoTill,
            new BigNumber("1000").mul(precision),
            new BigNumber("30000000"),
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
            .then((result) => assert.equal(result.valueOf(), new BigNumber("30000000"), "total supply is not equal"))
            .then(() => instance.locked.call())
            .then((result) => assert.equal(result.valueOf(), false, "locked is not equal"))
            .then(() => instance.icoSince.call())
            .then((result) => assert.equal(result.valueOf(), icoSince, "preIcoSince is not equal"))
            .then(() => instance.icoTill.call())
            .then((result) => assert.equal(result.valueOf(), icoTill, "preIcoSince is not equal"))
            .then(() => instance.minCap.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber("1000").mul(precision), "minCap is not equal"))
            .then(() => instance.tokenPrice.call())
            .then((result) => assert.equal(result.valueOf(), new BigNumber("3000"), "tokenPrice is not equal"))

            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000")))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("0").valueOf()));
    });

    it("create contract, buy tokens, get balance", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(function () {
                return Utils.receiptShouldSucceed;
            })
            .then(function () {
                return Utils.getBonusAmount(instance, 3000);
            })
            .then(function (totalAmount) {
                Utils.balanceShouldEqualTo(instance, accounts[0], totalAmount + 3000)
            }).then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "29996250"))
    });

    it("should  not be able to buy tokens before ICO", function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 + 3600 * 8;
        var icoTill = new Date().getTime() / 1000 + 3600 * 10;

        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000").valueOf()))
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "30000000"))
    });

    it("should  not be able to buy tokens after preICO", function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 - 3600 * 8;
        var icoTill = new Date().getTime() / 1000 - 3600 * 10;

        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000").valueOf()))
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "30000000"))
    });

    it("should  not be able to buy tokens if contract is locked", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000").valueOf()))
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "30000000"))
    });

    it("should be able to buy tokens, change token price", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds= 0;
        return Contract.new(
            new BigNumber("0.000333333").mul(100000000),
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("30000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(function () {
                return Utils.receiptShouldSucceed;
            })
            .then(function () {
                return Utils.getBonusAmount(instance, 3000);
            })
            .then(function (totalAmount) {
                acoount0Funds += totalAmount + 3000;
                Utils.balanceShouldEqualTo(instance, accounts[0], acoount0Funds)
            }).then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "29996250"))
            .then(function () {
                return instance.setTokenPrice(new BigNumber("4000"));
            })
            .then(Utils.receiptShouldSucceed)
            .then(function () {
                return instance.sendTransaction({value: 1});
            })
            .then(Utils.receiptShouldSucceed)
            .then(function () {
                return Utils.getBonusAmount(instance, 25000);
            }).then(function (totalAmount) {
                acoount0Funds += totalAmount + 25000;
                Utils.balanceShouldEqualTo(instance, accounts[0], acoount0Funds)
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "29965000"))
    });
});