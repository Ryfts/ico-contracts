var TestMultivest = artifacts.require("./test/TestMultivest.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');

/*
 + deploy & check allowed multivest addresses
 + set multivest & unset multivest, check accesses
 + set multivest & buyFor
 */

contract('Multivest', function(accounts) {
    it("deploy & check allowed multivest addresses", function() {
        var instance;

        return TestMultivest.new(
            accounts[1]
        )
            .then(function(_instance) {
                instance = _instance;
            })
            .then(() => instance.allowedMultivests.call(instance.address))
            .then((result) => assert.equal(result.valueOf(), false, "should be fail"))
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), false, "should be fail"))
            .then(() => instance.allowedMultivests.call(accounts[1]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"));
    });

    it("set multivest & unset multivest", function() {
        var instance;

        return TestMultivest.new(accounts[1])
            .then(function(_instance) {
                instance = _instance;
            })

            // Should fail to set multivest from non-owner
            .then(() => instance.setAllowedMultivest(accounts[0], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))

            // Successfully set multivest from owner
            .then(() => instance.setAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            /* Multiple times repeat same process */

            .then(() => instance.setAllowedMultivest(accounts[2], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => instance.allowedMultivests.call(accounts[2]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))

            .then(() => instance.setAllowedMultivest(accounts[2]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[2]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            .then(() => instance.unsetAllowedMultivest(accounts[0], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            .then(() => instance.unsetAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))

            .then(() => instance.unsetAllowedMultivest(accounts[2], {from: accounts[1]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => instance.allowedMultivests.call(accounts[2]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            .then(() => instance.unsetAllowedMultivest(accounts[2]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[2]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))
    });

    it("set multivest & buyFor", async function() {
        var instance;

        return TestMultivest.new(accounts[1])
            .then(function(_instance) {
                instance = _instance;
            })

            .then(() => instance.setAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), true, "should be true"))

            await instance.multivestBuy(accounts[1], 10000)
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 10000))

            .then(() => instance.multivestBuy(accounts[1], 10000, {from: accounts[2]}))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 10000))

            .then(() => instance.multivestBuy(accounts[1], 10000))
            .then(Utils.receiptShouldSucceed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 20000))
            
            .then(() => instance.unsetAllowedMultivest(accounts[0]))
            .then(Utils.receiptShouldSucceed)
            .then(() => instance.allowedMultivests.call(accounts[0]))
            .then((result) => assert.equal(result.valueOf(), false, "should be false"))

            .then(() => instance.multivestBuy(accounts[1], 10000))
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
            .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 20000))
    });
});