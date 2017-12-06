var Contract = artifacts.require("./Ryfts.sol");

var Utils = require("./utils");

var BigNumber = require('bignumber.js');
var precision = new BigNumber("1000000000000000000");
var preIcoSince = parseInt(new Date().getTime() / 1000) - 3600 * 2;
var preIcoTill = parseInt(new Date().getTime() / 1000) - 3605;
/*
 + create contract & check token info
 - transfer tokens, add reward, transfer tokens, claim, balance should equal zero
 - transfer tokens, add reward with 1 sec recycle, transfer tokens, timeout for 5 sec, balance should equal zero
 - test buy over mutlivest
 */

contract('Contract', function (accounts) {
    let instance;
    beforeEach(async function () {
        instance = await  Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        )
    });

    it("create contract & check token info", async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[7], new BigNumber("300000000000000").valueOf()));
    });

    it("create contract, buy tokens, get balance", async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000"});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2999625000000000"))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1000000000000000000", "collected amount is not equal");
            })
    });

    it("should  not be able to buy tokens before ICO", async function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 + 3600 * 8;  // 8 hours in future
        var icoTill = new Date().getTime() / 1000 + 3600 * 10;  // 10 hours in future

        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1000000000000000000});
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "3000000000000000"))
    });

    it("should  not be able to buy tokens after preICO", async function () {
        var instance;
        var icoSince = new Date().getTime() / 1000 - 3600 * 8;
        var icoTill = new Date().getTime() / 1000 - 3600 * 10;

        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1000000000000000000});
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "3000000000000000"))
    });

    it("should  not be able to buy tokens if contract is locked", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            true
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1000000000000000000});
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
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "3000000000000000"))
    });

    it("should be able to buy tokens, change token price", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000"});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000"))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1000000000000000000", "collected amount is not equal");
            })
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("2999625000000000")))
            .then(function () {
                return instance.setTokenPrice(0, new BigNumber("400000000000000"));
            })
            .then(Utils.receiptShouldSucceed)
            .then(function () {
                return instance.sendTransaction({value: new BigNumber("1000000000000000000")});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("687500000000")))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("2999312500000000")))
    });

    it("test different bonus amouns", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;

        var now = new Date().getTime() / 1000 + 10;
        var after3Hours = now + 3600 * 3 + 500;
        var after6Hours = now + 3600 * 6 + 500;
        var after9Hours = now + 3600 * 9 + 500;

        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => instance.getBonusAmount.call(now, new BigNumber("300000000000")))
            .then((result) => assert.equal(result.valueOf(), new BigNumber("75000000000"), "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(now, new BigNumber("10000000000000000")))
            .then((result) => assert.equal(result.valueOf(), new BigNumber("2500000000000000"), "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(now, new BigNumber("990090890000000000")))
            .then((result) => assert.equal(result.valueOf(), new BigNumber("247522722500000000"), "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after3Hours, 300000000000))
            .then((result) => assert.equal(result.valueOf(), 45000000000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after3Hours, 150000000000))
            .then((result) => assert.equal(result.valueOf(), 22500000000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after3Hours, new BigNumber("990090890000000000")))
            .then((result) => assert.equal(result.valueOf(), new BigNumber("148513633500000000"), "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after6Hours, new BigNumber(300000000000)))
            .then((result) => assert.equal(result.valueOf(), new BigNumber(15000000000), "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after6Hours, 10000000000))
            .then((result) => assert.equal(result.valueOf(), 500000000, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after6Hours, new BigNumber(99009089000000000)))
            .then((result) => assert.equal(result.valueOf(), new BigNumber(4950454450000000).valueOf(), "bonus is not equal"))

            .then(() => instance.getBonusAmount.call(after9Hours, 3000))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after9Hours, 100000000))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
            .then(() => instance.getBonusAmount.call(after9Hours, 9900908900))
            .then((result) => assert.equal(result.valueOf(), 0, "bonus is not equal"))
    });

    it("buy tokens for 1 ether", async function () {
        var instance;
        var preIcoSince = parseInt(new Date().getTime() / 1000) - 3600 * 2;
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 3600;
        var icoSince = parseInt(new Date().getTime() / 1000 - 200);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000"});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2999625000000000"))
    });

    it("buy tokens for 1 ether", async function () {
        var instance;

        var preIcoSince = parseInt(new Date().getTime() / 1000) - 3600 * 2;
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 3600;
        var icoSince = parseInt(new Date().getTime() / 1000 - 200);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoSince,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000", from: accounts[2]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "0"))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[2], "375000000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2999625000000000"))
    });

    it("set multivest address, multivest buy", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => instance.setAllowedMultivest(accounts[3]))
            .then(Utils.receiptShouldSucceed)

        await instance.multivestBuy(accounts[1], 1000000000000000000, {from: accounts[2]})
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 375000000000))

        await instance.multivestBuy(accounts[1], 2000000000000000000, {from: accounts[3]})
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1125000000000))

            .then(() => instance.collectedEthers.call())
            .then((result) => assert.equal(result.valueOf(), 3000000000000000000, "should equal 3 eth"))
    });

    it("buy, ico succed, ico finished, refund failed, transfer succeed", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333"),
            preIcoSince,
            preIcoTill,
            10000000000000,
            0,
            0,
            new BigNumber("333333333333"),
            icoSince,
            icoTill,
            new BigNumber("590000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "1000000000000000000"});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000375"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2624999999999625"))

            .then(() => instance.refund.call())
            .then((result) => assert.equal(result.valueOf(), false, "refund succeed"))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "ico finished"))

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "isIcoFinished set to true"))

            .then(() => instance.setICOPeriod(icoSince, icoSince + 1))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "ico finished"))

            .then(() => instance.icoFinished())

            .then(() => instance.soldTokens.call())
            .then((result) => assert.equal(result.valueOf(), 300000000000300, "soldTokens"))

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "isIcoFinished set to false"))

            .then(() => instance.isRefundAllowed.call())
            .then((result) => assert.equal(result.valueOf(), false, "isRefundAllowed set to true"))

            .then(() => instance.refund.call())
            .then((result) => assert.equal(result.valueOf(), false, "refund succeed"))

            .then(() => instance.balanceOf.call(instance.address))
            .then((result) => assert.equal(result.valueOf(), 0, "smart contract tokens not burned"))

            .then(() => instance.transfer(accounts[5], 1000))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 374999999999375))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[5], 1000))

            .then(() => instance.transfer(accounts[6], 100, {from: accounts[5]}))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 374999999999375))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[5], 900))
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[6], 100))
    });

    it("buy, ico succed, ico failed, refund succed", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await
        instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "333333333333"});
            })
            .then(function () {
                return instance.sendTransaction({value: "333333333333000", from: accounts[3]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "125000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2999874875000000"))

            .then(() => instance.refund.call())
            .then((result) => assert.equal(result.valueOf(), false, "refund succeed"))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "ico finished"))

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "isIcoFinished set to true"))

            .then(() => instance.setICOPeriod(icoSince, icoSince + 1))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "ico finished"))

            .then(() => instance.icoFinished())

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "isIcoFinished set to false"))

            .then(() => instance.isRefundAllowed.call())
            .then((result) => assert.equal(result.valueOf(), true, "isRefundAllowed set to false"))

            .then(() => Utils.balanceShouldEqualTo(instance, accounts[2], 0))
            .then(() => instance.sentEthers.call(accounts[2]))
            .then((result) => assert.equal(result.valueOf(), 0, "ether balance not equal to zero"))
            .then(() => instance.refund.call({from: accounts[2]}))
            .then((result) => assert.equal(result.valueOf(), false, "refund succeed"))
            .then(() => instance.refund({from: accounts[2]}))
            .then(Utils.receiptShouldSucceed)

            .then(() => instance.refund.call())
            .then((result) => assert.equal(result.valueOf(), true, "refund failed"))
            .then(() => instance.refund())
            .then(Utils.receiptShouldSucceed)

            .then(() => instance.refundFor.call(accounts[3]))
            .then((result) => assert.equal(result.valueOf(), true, "refund failed"))
            .then(() => instance.refundFor(accounts[3]))
            .then(Utils.receiptShouldSucceed)

            .then(() => instance.refund.call({from: accounts[3]}))
            .then((result) => assert.equal(result.valueOf(), false, "refund succed"))
            .then(() => instance.refund({from: accounts[3]}))
            .then(Utils.receiptShouldSucceed)

            .then(() => instance.balanceOf.call(instance.address))
            .then((result) => assert.equal(result.valueOf(), 0, "smart contract tokens not burned"))
    });

    it("buy, ico succed, ico failed, refund succed, transfer failed", function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var acoount0Funds = 0;
        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await
        instance.setSalePhases(
            new BigNumber("333333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: "333333333333"});
            })
            .then(function () {
                return instance.sendTransaction({value: "333333333333000", from: accounts[3]});
            })
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "125000000"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2999874875000000"))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "ico finished"))

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), false, "isIcoFinished set to true"))

            .then(() => instance.setICOPeriod(icoSince, icoSince + 1))

            .then(() => instance.icoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "ico finished"))

            .then(() => instance.icoFinished())

            .then(() => instance.isIcoFinished.call())
            .then((result) => assert.equal(result.valueOf(), true, "isIcoFinished set to false"))

            .then(() => instance.isRefundAllowed.call())
            .then((result) => assert.equal(result.valueOf(), true, "isRefundAllowed set to false"))

            .then(() => instance.transfer(accounts[5], 1000))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
    });

    it("set multivest & buy", async function () {
        var instance;
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;

        return Contract.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        ).then(function (_instance) {
            instance = _instance;
        })
        await instance.setSalePhases(
            new BigNumber("333333333333"),
            preIcoSince,
            preIcoTill,
            10000000000000,
            0,
            0,
            new BigNumber("333333333333"),
            icoSince,
            icoTill,
            new BigNumber("590000000000000")
        )
            .then(() => instance.setAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

        await instance.multivestBuy(accounts[1], 10000)
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 3))

            .then(() => instance.multivestBuy(accounts[1], 10000, {from: accounts[2]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 3))

            .then(() => instance.multivestBuy(accounts[1], 10000))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 6))

            .then(() => instance.unsetAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))

            .then(() => instance.multivestBuy(accounts[1], 10000))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 6))
    });
});