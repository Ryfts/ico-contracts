var BigNumber = require('bignumber.js');

var gasToUse = 0x47E7C4;

function receiptShouldSucceed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            try {
                assert.notEqual(result.receipt.gasUsed, gasToUse, "tx failed, used all gas");
            }
            catch(err) {
                reject(err);
            }
        }
        else {
            console.log('gasUsed',result.receipt.gasUsed);
            resolve();
        }
    });
}

function receiptShouldFailed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            resolve();
        }
        else {
            try {
                assert.equal(result.receipt.gasUsed, gasToUse, "tx succeed, used not all gas");
            }
            catch(err) {
                reject(err);
            }
        }
    });
}

function catchReceiptShouldFailed(err) {
    if (err.message.indexOf("invalid opcode") == -1) {
        throw err;
    }
}

function balanceShouldEqualTo(instance, address, expectedBalance, notCall) {
    return new Promise(function(resolve, reject) {
        var promise;

        if(notCall) {
            promise = instance.balanceOf(address)
                .then(function() {
                    return instance.balanceOf.call(address);
                });
        }
        else {
            promise = instance.balanceOf.call(address);
        }

        promise.then(function(balance) {
            try {
                assert.equal(balance.valueOf(), expectedBalance, "balance is not equal");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function timeout(timeout) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, timeout * 1000);
    })
}

function getEtherBalance(_address) {
    return web3.eth.getBalance(_address);
}

function checkEtherBalance(_address, expectedBalance) {
    var balance = web3.eth.getBalance(_address);

    assert.equal(balance.valueOf(), expectedBalance.valueOf(), "address balance is not equal");
}

function getTxCost(result) {
    var tx = web3.eth.getTransaction(result.tx);

    return result.receipt.gasUsed * tx.gasPrice;
}
function getBonusAmount(instance, amount) {
    return new Promise(function (resolve, reject) {
        var time = parseInt(new Date().getTime() / 1000);
        var promise = instance.icoSince.call()
            .then(function (value) {
                return value.valueOf();
            }).then(function (icoSince) {
                if (time < icoSince) {
                    bonus = 0;
                }

                if (time - icoSince <= 10800) {             // 3h since ico => reward 25%
                    bonus = amount * 25 / 100;
                }
                else if (time - icoSince <= 21600) {        // 6h since ico => reward 15%
                    bonus = amount * 15 / 100;
                }
                else if (time - icoSince <= 32400) {        // 9h since ico => reward 5%
                    bonus = amount * 5 / 100;
                } else {
                    bonus = 0;
                }
                resolve(bonus);
            });
    });
}

module.exports = {
    receiptShouldSucceed: receiptShouldSucceed,
    receiptShouldFailed: receiptShouldFailed,
    catchReceiptShouldFailed: catchReceiptShouldFailed,
    balanceShouldEqualTo: balanceShouldEqualTo,
    timeout: timeout,
    getEtherBalance: getEtherBalance,
    checkEtherBalance: checkEtherBalance,
    getBonusAmount: getBonusAmount,
    getTxCost: getTxCost
};