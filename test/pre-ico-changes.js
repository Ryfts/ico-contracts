var Ryfts = artifacts.require('./Ryfts.sol');
var RyftsTest = artifacts.require('./test/RyftsTest.sol'),
    BigNumber = require('bignumber.js'),
    Utils = require("./utils");

var precision = new BigNumber("1000000000000000000");   // 18 decimals
var totalAmount = new BigNumber("33000000").mul(precision); // supply
var reservedAmount = new BigNumber("3000000").mul(precision);
var sellAmount = totalAmount - reservedAmount;
var preicoAmount = 700000000000000000000000;

/** In case of testing multivest **/
var abi = require('ethereumjs-abi'),
    BN = require('bn.js');
// console.log(web3.eth.accounts[0], web3.eth.accounts[0].substr(2), new BN(web3.eth.accounts[0].substr(2), 16));

var signAddress = web3.eth.accounts[1],
    WrongSigAddress = web3.eth.accounts[7],

    h = abi.soliditySHA3(['address'], [new BN(web3.eth.accounts[0].substr(2), 16)]),
    sig = web3.eth.sign(signAddress, h.toString('hex')).slice(2),
    r = `0x${sig.slice(0, 64)}`,
    s = `0x${sig.slice(64, 128)}`,
    v = web3.toDecimal(sig.slice(128, 130)) + 27;

function makeTransaction(instance, value) {
    "use strict";
    // var data = abi.simpleEncode("multivestBuy(bytes32,uint8,bytes32,bytes32)", h, v, r, s);

    return instance.sendTransaction({value: value});
}
/*** End multivest related ***/

contract('pre-ICO', function (accounts) {
    let instance;
    beforeEach(async function () {
        instance = await  Ryfts.new(
            accounts[7],
            reservedAmount,
            totalAmount,
            "Ryfts",
            "RFT",
            0,
            false
        )
    });

    it('create contract, buy tokens with correct sign address, get balance, check price', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("3333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("3333333333333"),
            icoSince,
            icoTill,
            new BigNumber("2000000000000000000000")
        )
        // await instance.setWhitelistStatus(true)
            .then(() => Utils.balanceShouldEqualTo(
              instance, instance.address, sellAmount.valueOf())
            )
            .then(function () {
                return instance.sendTransaction({value: 1000000000000000000});
            })

            .then(Utils.receiptShouldSucceed)
            .then(() => async function() {
              const withBonus = await instance.getBonusAmount(new Date().getTime(), 1 * precision);
              await Utils.balanceShouldEqualTo(instance, accounts[0], withBonus.toNumber());
              return Utils.balanceShouldEqualTo(
                instance, instance.address, preicoAmount - withBonus
              )
            })
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1000000000000000000", "collected amount is not equal");
            })
    });

    it('create contract with whitelist, buy tokens, setMinMax contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
          new BigNumber("33333333333333333"),
          preIcoSince,
          preIcoTill,
          new BigNumber(preicoAmount),
          0,
          0,
          new BigNumber("33333333333333333"),
          icoSince,
          icoTill,
          new BigNumber("20000000000000000000000")
        );
        // await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => makeTransaction(instance,  web3.toWei('1', 'ether')))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            .then(() => makeTransaction(instance, web3.toWei('3.1', 'ether')))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await instance.setMinMaxContribution(0, web3.toWei('0', 'ether'),  web3.toWei('0', 'ether'))
            .then(() => makeTransaction(instance, web3.toWei('1', 'ether')))
            .then(Utils.receiptShouldSucceed)
    });

    it('create contract with whitelist, buy tokens buy old contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
          new BigNumber("33333333333333333"),
          preIcoSince,
          preIcoTill,
          new BigNumber(preicoAmount),
          0,
          0,
          new BigNumber("33333333333333333"),
          icoSince,
          icoTill,
          new BigNumber("20000000000000000000000")
        );
            await instance.setAllowedMultivest(accounts[0]);
            await instance.setWhitelistStatus(true);
            await instance.addToWhitelist(0, accounts[0]);
            await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
            await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("60000000000000000600").valueOf()))
        });

    it('should not be able to buy without whitelist', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
          new BigNumber("33333333333333333"),
          preIcoSince,
          preIcoTill,
          new BigNumber(preicoAmount),
          0,
          0,
          new BigNumber("33333333333333333"),
          icoSince,
          icoTill,
          new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0]);
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("60000000000000000600").valueOf()))
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether'), from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
            await instance.removeFromWhitelist(0, accounts[0])
                .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);
        await instance.setWhitelistStatus(false)
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether'), from: accounts[1]}))
            .then(Utils.receiptShouldSucceed)
    });

    it('check ValuePermission', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        instance = await  RyftsTest.new(
            accounts[7],
            new BigNumber("300000000000000").mul(precision),
            new BigNumber("3300000000000000").mul(precision),
            "Ryfts",
            "RFT",
            0,
            false
        );

        await instance.setSalePhases(
            new BigNumber("333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber("10000000000000").mul(precision),
            0,
            0,
            new BigNumber("333333333333"),
            icoSince,
            icoTill,
            new BigNumber("590000000000000").mul(precision),
        );
        await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
        let testPersion = await instance.checkValuePermissionTest.call(0, web3.toWei('2', 'ether'))
        assert.equal(testPersion.valueOf(), true, "testPersion is not equal");
         testPersion = await instance.checkValuePermissionTest.call(0, web3.toWei('3', 'ether'))
        assert.equal(testPersion.valueOf(), true, "testPersion is not equal");
         testPersion = await instance.checkValuePermissionTest.call(0, web3.toWei('1', 'ether'))
        assert.equal(testPersion.valueOf(), false, "testPersion is not equal");
        testPersion = await instance.checkValuePermissionTest.call(0, web3.toWei('4', 'ether'))
        assert.equal(testPersion.valueOf(), false, "testPersion is not equal");
        testPersion = await instance.checkValuePermissionTest.call(1, web3.toWei('4', 'ether'))
        assert.equal(testPersion.valueOf(), true, "testPersion is not equal");
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('0', 'ether'))
        assert.equal(testPersion.valueOf(), true, "testPersion is not equal");
    });

    it('check getCurrentPhase', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        instance = await  RyftsTest.new(
            accounts[7],
            new BigNumber("300000000000000").mul(precision),
            new BigNumber("3300000000000000").mul(precision),
            "Ryfts",
            "RFT",
            0,
            false
        )

        await instance.setSalePhases(
            new BigNumber("333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber("10000000000000").mul(precision),
            0,
            0,
            new BigNumber("333333333333"),
            icoSince,
            icoTill,
            new BigNumber("590000000000000").mul(precision),
        )
        await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
        let currentPhase = await instance.getCurrentPhase.call(0)
        assert.equal(currentPhase.valueOf(), 2, "testPersion is not equal");
        currentPhase = await instance.getCurrentPhase.call(icoSince)
        assert.equal(currentPhase.valueOf(), 1, "testPersion is not equal");
        currentPhase = await instance.getCurrentPhase.call(preIcoSince)
        assert.equal(currentPhase.valueOf(), 0, "testPersion is not equal");
        currentPhase = await instance.getCurrentPhase.call(preIcoTill)
        assert.equal(currentPhase.valueOf(), 0, "testPersion is not equal");
        currentPhase = await instance.getCurrentPhase.call(icoSince+8)
        assert.equal(currentPhase.valueOf(), 1, "testPersion is not equal");
        currentPhase = await instance.getCurrentPhase.call(icoTill+ 3600)
        assert.equal(currentPhase.valueOf(), 2, "testPersion is not equal");
    });

    it('should not be able to buy without whitelist', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0]);
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("600000000000000000600").valueOf()))
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether'), from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await instance.setWhitelistStatus(false)
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether'), from: accounts[1]}))
            .then(Utils.receiptShouldSucceed)
    });

    it("test different bonus amounts", async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600 * 8;
        var preIcoSince = parseInt(new Date().getTime() / 1000) - 3600 * 2;
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 3605;

        var now = new Date().getTime() / 1000 + 10;
        var after3Hours = now + 3600 * 3 + 500;
        var after6Hours = now + 3600 * 6 + 500;
        var after9Hours = now + 3600 * 9 + 500;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );

        let bonusAmount = await instance.getBonusAmount.call(now, new BigNumber("300000000000"));
        assert.equal(bonusAmount.valueOf(), new BigNumber("75000000000"), "bonus is not equal");
        bonusAmount = await instance.getBonusAmount.call(now, new BigNumber("10000000000000000"));
        assert.equal(bonusAmount.valueOf(), new BigNumber("2500000000000000"), "bonus is not equal");
        bonusAmount = await instance.getBonusAmount.call(now, new BigNumber("990090890000000000"));
        assert.equal(bonusAmount.valueOf(), new BigNumber("247522722500000000"), "bonus is not equal");

        bonusAmount = await instance.getBonusAmount.call(after3Hours, 300000000000)
        assert.equal(bonusAmount.valueOf(), 45000000000, "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after3Hours, 150000000000)
        assert.equal(bonusAmount.valueOf(), 22500000000, "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after3Hours, new BigNumber("990090890000000000"))
        assert.equal(bonusAmount.valueOf(), new BigNumber("148513633500000000"), "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after6Hours, new BigNumber(300000000000))
        assert.equal(bonusAmount.valueOf(), new BigNumber(15000000000), "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after6Hours, 10000000000)
        assert.equal(bonusAmount.valueOf(), 500000000, "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after6Hours, new BigNumber(99009089000000000))
        assert.equal(bonusAmount.valueOf(), new BigNumber(4950454450000000).valueOf(), "bonus is not equal")

        bonusAmount = await instance.getBonusAmount.call(after9Hours, 3000)
        assert.equal(bonusAmount.valueOf(), 0, "bonus is not equal")
        bonusAmount = await instance.getBonusAmount.call(after9Hours, 100000000)
        assert.equal(bonusAmount.valueOf(), 0, "bonus is not equal")
        bonusAmount = await  instance.getBonusAmount.call(after9Hours, 9900908900)
        assert.equal(bonusAmount.valueOf(), 0, "bonus is not equal")
    });

    it('create contract, set new Price, multivest buy', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0]);
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.setTokenPrice(0, new BigNumber("11111111111111"));
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
          .catch(log => console.log(log))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              // instance, accounts[0], new BigNumber("1800000000000000180000").valueOf())
              instance, accounts[0], new BigNumber(web3.toWei('2', 'ether')).div("11111111111111").mul(precision).valueOf()
            ))
    });

    it('create contract, setPeriod', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0]);
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.setPeriod(0, parseInt(new Date().getTime() / 1000 - 3600), parseInt(new Date().getTime() / 1000) + 3600);
        await instance.setTokenPrice(0, new BigNumber("11111111111111"));
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              instance, accounts[0], new BigNumber(web3.toWei('2', 'ether')).div("11111111111111").mul(precision).valueOf()
            ));
    });

    it('create contract, setLocked', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0]);
        await instance.setWhitelistStatus(true);
        await instance.addToWhitelist(0, accounts[0]);
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.setLocked(true);
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await instance.setLocked(false);
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              instance, accounts[0], new BigNumber(web3.toWei('2', 'ether')).div("33333333333333333").mul(precision).valueOf()
            ))
    });

    it('create contract, setFinished', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("20000000000000000000000")
        );
        await instance.setAllowedMultivest(accounts[0])
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.finished(0);
        let isActive = await instance.isActive(0);
        assert.equal(isActive.valueOf(), true, "isActive is not equal");
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether').valueOf())
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              instance, accounts[0], new BigNumber(web3.toWei('2', 'ether')).div("33333333333333333").mul(precision).valueOf()
            ));
        await instance.setPeriod(0, parseInt(new Date().getTime() / 1000 -4* 3600), parseInt(new Date().getTime() / 1000) - 3600)
        await instance.finished(0);
        isActive = await instance.isActive(0);
        assert.equal(isActive.valueOf(), false, "isActive is not equal");
        await instance.transferEthers()
    });

    it('create contract, set ICO Finished', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 8*3600);
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 3*3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("0"),
        );
        await instance.setAllowedMultivest(accounts[0])
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.finished(1);
        let isActive = await instance.isActive(1);
        assert.equal(isActive.valueOf(), true, "isActive is not equal");
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              instance, accounts[0], new BigNumber("75000000000000000750").valueOf()  // re-check this math
            ));
        await instance.setPeriod(1, parseInt(new Date().getTime() / 1000 -4* 3600), parseInt(new Date().getTime() / 1000) - 3600);
        await instance.finished(1);
        await instance.finished(1);
        isActive = await instance.isActive(1);
        assert.equal(isActive.valueOf(), false, "isActive is not equal");
        let isRefundAllowed = await instance.isRefundAllowed.call();
         assert.equal(isRefundAllowed.valueOf(), false, "isRefundAllowed set to false");
        await instance.transferEthers();
    });

    it('create contract, send zero ethers', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000) - 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 8*3600);
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 3*3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("0"),
        )
        await instance.setAllowedMultivest(accounts[0])
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
        await instance.finished(1);
        let isActive = await instance.isActive(1);
        assert.equal(isActive.valueOf(), true, "isActive is not equal")
        await instance.multivestBuy(accounts[0], web3.toWei('0', 'ether').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            //0*10^18 * (10 ^ 8) / 333333333333
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("0").valueOf()))
    });

    it('create contract, sale all tokens', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
          new BigNumber("333333333333"),
          preIcoSince,
          preIcoTill,
          new BigNumber("600000000000600").mul(10000000000),
          0,
          0,
          new BigNumber("33333333333333333"),
          icoSince,
          icoTill,
          new BigNumber("20000000000000000000000")
        );

        await instance.setAllowedMultivest(accounts[0])
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.finished(0);
        let isActive = await instance.isActive(0);
        assert.equal(isActive.valueOf(), true, "isActive is not equal");
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              //2*10^18 * (10 ^ 18) / 333333333333
              instance, accounts[0], new BigNumber(web3.toWei('2', 'ether')).div("333333333333").mul(precision).valueOf()
            ));
        await instance.finished(0);
        isActive = await instance.isActive(0);
        assert.equal(isActive.valueOf(), false, "isActive is not equal");
        await instance.transfer(accounts[5], 1000)
            .then(Utils.receiptShouldSucceed)
        await instance.refund()
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await instance.refundFor(accounts[4])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await instance.transferEthers()
    });

    /*it('create contract, refund', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)- 2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 3600);
        var preIcoTill = parseInt(new Date().getTime() / 1000) - 600;

        await instance.setSalePhases(
            new BigNumber("33333333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333333"),
            icoSince,
            icoTill,
            new BigNumber("0"),
        )
        await instance.setAllowedMultivest(accounts[0])
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
        await instance.finished(1);
        let isActive = await instance.isActive(1);
        assert.equal(isActive.valueOf(), true, "isActive is not equal")
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("75000000000000000750").valueOf()));
        await instance.sendTransaction({from:accounts[3], value: web3.toWei('2', 'ether')})
            .then(Utils.receiptShouldSucceed)
        await instance.setPeriod(1, parseInt(new Date().getTime() / 1000 - 3*3600), parseInt(new Date().getTime() / 1000) - 2 * 3600)
        await instance.finished(1);
        isActive = await instance.isActive(1);
        assert.equal(isActive.valueOf(), false, "isActive is not equal");
        await instance.refund()
        .then(Utils.receiptShouldSucceed);
        await instance.refund({from:accounts[2]})
        .then(Utils.receiptShouldSucceed)
        await instance.refundFor(accounts[3])
        .then(Utils.receiptShouldSucceed)
        await instance.refundFor(accounts[4])
        .then(Utils.receiptShouldSucceed)
        .then(() => instance.isRefundAllowed.call())
        .then((result) => assert.equal(result.valueOf(), true, "isRefundAllowed set to false"))

        .then(() => instance.transfer(accounts[5], 1000))
        .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed)
    });*/

    it('create contract, not enough tokens to buy', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("33333333333333"),
            preIcoSince,
            preIcoTill,
            new BigNumber(preicoAmount),
            0,
            0,
            new BigNumber("33333333333333"),
            icoSince,
            icoTill,
            new BigNumber("27000000000027000000000000"),
        )
        await instance.setAllowedMultivest(accounts[0])
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
        await instance.setTokenPrice(0, new BigNumber("11111111111111"));
        await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether'))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(
              //2*10^18 / 111111111111
              instance, accounts[0], 2 * precision / 11111111111111 * precision)
            )
        await instance.multivestBuy(accounts[0], web3.toWei('2.5', 'ether'))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.transferEthers()
    });
});