var Ryfts = artifacts.require('./Ryfts.sol'),
    RyftsTest = artifacts.require('./RyftsTest.sol'),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber(1000000000000000000),
    Utils = require("./utils");

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

contract('ICO changes to multivest', function (accounts) {
    let instance;
    beforeEach(async function () {
        instance = await  Ryfts.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
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
            new BigNumber("333333333333"),
            preIcoSince,
            preIcoTill,
            70000000000000,
            0,
            0,
            new BigNumber("333333333333"),
            icoSince,
            icoTill,
            new BigNumber("200000000000000")
        )
        // await instance.setWhitelistStatus(true)
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, new BigNumber("3000000000000000").valueOf()))
            .then(function () {
                return instance.sendTransaction({value: 1000000000000000000});
            })

                .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "300000000000300"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2699999999999700"))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1000000000000000000", "collected amount is not equal");
            })
    });

    it('create contract, buy tokens, setMinMax contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

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
        // await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => makeTransaction(instance, new BigNumber("1000000000000000000").valueOf()))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether').valueOf()))
            .then(Utils.receiptShouldSucceed)
            .then(() => makeTransaction(instance, web3.toWei('3.1', 'ether').valueOf()))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.setMinMaxContribution(0, web3.toWei('0', 'ether'),  web3.toWei('0', 'ether'))
            .then(() => makeTransaction(instance, new BigNumber("1000000000000000000").valueOf()))
            .then(Utils.receiptShouldSucceed)
    });

    it('create contract, buy tokens buy old contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

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
            await instance.setAllowedMultivest(accounts[0])
            await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
            await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether').valueOf())
            .then(Utils.receiptShouldSucceed)
        //2*10^18 * (10 ^ 8) / 333333333333
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("600000000000600").valueOf()))
        });

    it('should not be able to buy without whitelist', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

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
        await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            //2*10^18 * (10 ^ 8) / 333333333333
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("600000000000600").valueOf()))
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf(), from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.setWhitelistStatus(false)
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf(), from: accounts[1]}))
            .then(Utils.receiptShouldSucceed)
    });

    it('check ValuePermission', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        instance = await  RyftsTest.new(
            accounts[7],
            new BigNumber("300000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            0,
            false
        )

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

    it('should not be able to buy without whitelist', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000)+ 3600*2;
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600*3;
        var preIcoSince = parseInt(new Date().getTime() / 1000 - 200);
        var preIcoTill = parseInt(new Date().getTime() / 1000) + 3600;

        await instance.setSalePhases(
            new BigNumber("333333333333"), //_preIcoTokenPrice
            preIcoSince,// _preIcoSince
            preIcoTill, //_preIcoTill
            10000000000000, //_allocatedTokensForPreICO
            0, //_minPreIcoContribution
            0, //_maxPreIcoContribution
            new BigNumber("333333333333"), //_icoTokenPrice
            icoSince, //_icoSince
            icoTill, //_icoTill
            new BigNumber("590000000000000") //_goalIcoMinSoldTokens
        )
        await instance.setAllowedMultivest(accounts[0])
        await instance.setWhitelistStatus(true)
        await instance.addToWhitelist(0, accounts[0])
        await instance.setMinMaxContribution(0, web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            //2*10^18 * (10 ^ 8) / 333333333333
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("600000000000600").valueOf()))
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf(), from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.setWhitelistStatus(false)
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf(), from: accounts[1]}))
            .then(Utils.receiptShouldSucceed)
    });

});