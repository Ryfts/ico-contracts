pragma solidity ^0.4.13;

import './ERC20.sol';
import './Multivest.sol';

contract RyftsICO is ERC20, Multivest {

    uint256 public icoSince;

    uint256 public icoTill;

    uint256 public soldTokens;
    uint256 public goalMinSoldTokens;

    uint256 public tokenPrice;  // 333333333333333

    uint256 public collectedEthers;

    bool public isIcoFinished;

    bool public isRefundAllowed;
    
    mapping (address => uint256) public sentEthers;

    event Refund(address holder, uint256 ethers, uint256 tokens);

    function RyftsICO(
    uint256 _tokenPrice,
    address reserveAccount,
    uint256 reserveAmount,
    uint256 _icoSince,
    uint256 _icoTill,
    uint256 _goalMinSoldTokens,
    uint256 initialSupply,
    string tokenName,
    string tokenSymbol,
    address multivestMiddleware,
    bool _locked
    ) ERC20(initialSupply, tokenName, 8, tokenSymbol, false, _locked) Multivest(multivestMiddleware) {
        standard = 'Ryfts 0.1';
        icoSince = _icoSince;
        icoTill = _icoTill;
        goalMinSoldTokens = _goalMinSoldTokens;
        tokenPrice = _tokenPrice;

        require(reserveAmount <= initialSupply);

        balanceOf[reserveAccount] = reserveAmount;
        balanceOf[this] -= balanceOf[reserveAccount];
    
        Transfer(this, reserveAccount, balanceOf[reserveAccount]);
    }

    function getBonusAmount(uint256 time, uint256 amount) returns (uint256) {
        if (time < icoSince) {
            return 0;
        }

        if (time - icoSince <= 10800) {// 3h since ico => reward 25%
            return amount * 25 / 100;
        }
        else if (time - icoSince <= 21600) {// 6h since ico => reward 15%
            return amount * 15 / 100;
        }
        else if (time - icoSince <= 32400) {// 9h since ico => reward 5%
            return amount * 5 / 100;
        }

        return 0;
    }

    function buy(address _address, uint256 time, uint256 value) internal returns (bool) {
        if (locked == true) {
            return false;
        }

        if (time < icoSince) {
            return false;
        }

        if (time > icoTill) {
            return false;
        }

        if (value == 0) {
            return false;
        }

        uint256 amount = value * (uint256(10) ** decimals) / tokenPrice;

        if (amount == 0) {
            return false;
        }

        soldTokens += amount;

        uint256 totalAmount = amount + getBonusAmount(now, amount);

        if (balanceOf[this] < totalAmount) {
            return false;
        }

        if (balanceOf[_address] + totalAmount < balanceOf[_address]) {
            return false;
        }

        balanceOf[this] -= totalAmount;
        balanceOf[_address] += totalAmount;

        collectedEthers += value;

        Transfer(this, _address, totalAmount);

        return true;
    }

    function() payable {
        bool status = buy(msg.sender, now, msg.value);

        require(status == true);

        sentEthers[msg.sender] += msg.value;
    }

    function transferInternal(address _from, address _to, uint256 value) internal returns (bool success) {
        require(isIcoFinished == true && isRefundAllowed == false);

        return super.transferInternal(_from, _to, value);
    }

    function setTokenPrice(uint256 _value) onlyOwner {
        tokenPrice = _value;
    }

    function setICOPeriod(uint256 _icoSince, uint256 _icoTill) onlyOwner {
        icoSince = _icoSince;
        icoTill = _icoTill;
    }

    function setLocked(bool _locked) onlyOwner {
        locked = _locked;
    }

    function icoFinished() returns (bool) {
        if(isIcoFinished == true) {
            return true;
        }

        if (now > icoTill || balanceOf[this] == 0) {
            if (soldTokens >= goalMinSoldTokens) {
                isRefundAllowed = false;
            }
            else {
                isRefundAllowed = true;
            }

            isIcoFinished = true;

            balanceOf[this] = 0;
        }

        return isIcoFinished;
    }

    function refundInternal(address holder) internal returns (bool success) {
        if (isIcoFinished == true && isRefundAllowed == true) {
            uint256 refundEthers = sentEthers[holder];
            uint256 refundTokens = balanceOf[holder];

            if(refundEthers == 0 && refundTokens == 0) {
                return false;
            }

            balanceOf[holder] = 0;
            sentEthers[holder] = 0;

            if (refundEthers > 0) {
                holder.transfer(refundEthers);
            }

            Refund(holder, refundEthers, refundTokens);

            return true;
        }

        return false;
    }

    function refund() returns (bool) {
        return refundInternal(msg.sender);
    }

    function refundFor(address holder) returns (bool) {
        return refundInternal(holder);
    }

    function transferEthers() onlyOwner {
        if (isIcoFinished == true && isRefundAllowed == false) {
            owner.transfer(this.balance);
        }
    }
}
