var RyftsICO = artifacts.require('./RyftsICO.sol'),
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
    var data = abi.simpleEncode("multivestBuy(bytes32,uint8,bytes32,bytes32)", h, v, r, s);

    return instance.sendTransaction({value: value, data: data.toString('hex')});
}

contract('ICO changes to multivest', function (accounts) {

    it('create contract, buy tokens with correct sign address, get balance, check price', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        let instance = await RyftsICO.new(
            new BigNumber("333333333333"),
            accounts[7],
            new BigNumber("300000000000000"),
            icoSince,
            icoTill,
            new BigNumber("600000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            signAddress,
            false
        )
            await instance.setAllowedMultivest(accounts[0])
            await instance.setMultivestStatus(true)
                .then(() => instance.allowedMultivests.call(accounts[0]))
                .then((result) => assert.equal(result.valueOf(), true, "should be true"))
                .then(() => makeTransaction(instance, new BigNumber("1000000000000000000").valueOf()))
                .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], "375000000000375"))
            .then(() => Utils.balanceShouldEqualTo(instance, instance.address, "2624999999999625"))
            .then(function () {
                return instance.collectedEthers.call();
            })
            .then(function (result) {
                assert.equal(result.valueOf(), "1000000000000000000", "collected amount is not equal");
            })
    });

    it('create contract, buy tokens, setMinMax contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        let instance = await RyftsICO.new(
            new BigNumber("333333333333"),
            accounts[7],
            new BigNumber("300000000000000"),
            icoSince,
            icoTill,
            new BigNumber("600000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            signAddress,
            false
        )
        await instance.setAllowedMultivest(accounts[0])
        await instance.setMultivestStatus(true)
        await instance.setMinMaxContribution( web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, new BigNumber("1000000000000000000").valueOf()))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether').valueOf()))
            .then(Utils.receiptShouldSucceed)
            .then(() => makeTransaction(instance, web3.toWei('3.1', 'ether').valueOf()))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.setMinMaxContribution( web3.toWei('0', 'ether'),  web3.toWei('0', 'ether'))
            .then(() => makeTransaction(instance, new BigNumber("1000000000000000000").valueOf()))
            .then(Utils.receiptShouldSucceed)
    });

    it('create contract, buy tokens buy old contribution', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        let instance = await RyftsICO.new(
            new BigNumber("333333333333333"),
            accounts[7],
            new BigNumber("300000000000000"),
            icoSince,
            icoTill,
            new BigNumber("600000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            signAddress,
            false
        )
            await instance.setAllowedMultivest(accounts[0])
            await instance.setMultivestStatus(true)
            await instance.setMinMaxContribution( web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            await instance.multivestBuy(accounts[0], web3.toWei('2', 'ether').valueOf())
            .then(Utils.receiptShouldSucceed)
        //2*10^18 * (10 ^ 8) / 333333333333 + 0.25 bouns
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("750000000000").valueOf()))
        });

    it('should not be able to buy without multivest', async function () {
        var icoSince = parseInt(new Date().getTime() / 1000);
        var icoTill = parseInt(new Date().getTime() / 1000) + 3600;

        let instance = await RyftsICO.new(
            new BigNumber("333333333333333"),
            accounts[7],
            new BigNumber("300000000000000"),
            icoSince,
            icoTill,
            new BigNumber("600000000000000"),
            new BigNumber("3300000000000000"),
            "Ryfts",
            "RFT",
            signAddress,
            false
        )
        await instance.setAllowedMultivest(accounts[0])
        await instance.setMultivestStatus(true)
        await instance.setMinMaxContribution( web3.toWei('2', 'ether'),  web3.toWei('3', 'ether'))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))
            .then(() => makeTransaction(instance, web3.toWei('2', 'ether')))
            .then(Utils.receiptShouldSucceed)
            //2*10^18 * (10 ^ 8) / 333333333333 + 0.25 bouns
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], new BigNumber("750000000000").valueOf()))
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf()}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await instance.setMultivestStatus(false)
            .then(() => instance.sendTransaction({value: web3.toWei('2', 'ether').valueOf()}))
            .then(Utils.receiptShouldSucceed)
    });
});