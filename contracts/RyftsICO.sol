pragma solidity ^0.4.13;


import './ERC20.sol';


contract RyftsICO is ERC20 {

    uint256 public icoSince;

    uint256 public icoTill;

    uint256 public minIcoGoalTokens;

    uint256 public tokenPrice;  // 333333333333333

    uint256 public collectedEthers;

    bool public isIcoFinished;

    bool public isRefundAllowed;

    mapping (address => uint256) sentEthers;

    function RyftsICO(
    uint256 _tokenPrice,
    address reserveAccount,
    uint256 reserveAmount,
    uint256 _icoSince,
    uint256 _icoTill,
    uint256 _minIcoGoalTokens,
    uint256 initialSupply,
    string tokenName,
    string tokenSymbol,
    bool _locked
    ) ERC20(initialSupply, tokenName, 8, tokenSymbol, false, _locked) {
        standard = 'Ryfts 0.1';
        icoSince = _icoSince;
        icoTill = _icoTill;
        minIcoGoalTokens = _minIcoGoalTokens;
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

        sentEthers[_address] += value;

        Transfer(this, _address, totalAmount);

        return true;
    }

    function() payable {
        bool status = buy(msg.sender, now, msg.value);
        require(status == true);
    }

    function transfer(address _to, uint256 _value) onlyPayloadSize(2) {
        require(isIcoFinished == true && isRefundAllowed == true);

        super.transfer(_to, _value);
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

    function icoFinished() {
        if (now > icoTill) {
            if (balanceOf[this] > minIcoGoalTokens) {
                isRefundAllowed = true;
            }
            else {
                isRefundAllowed = false;
            }

            isIcoFinished = true;
        }
    }

    function refund() returns (bool) {
        if (isIcoFinished == true && isRefundAllowed == true) {
            if (sentEthers[msg.sender] > 0) {
                uint256 ethersToSent = sentEthers[msg.sender];

                sentEthers[msg.sender] = 0;

                msg.sender.transfer(ethersToSent);

                return true;
            }
        }

        return false;
    }

    function transferEthers() onlyOwner {
        if (isIcoFinished == true && isRefundAllowed == false) {
            owner.transfer(this.balance);
        }
    }
}
