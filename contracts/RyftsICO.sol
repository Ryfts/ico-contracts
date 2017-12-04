pragma solidity 0.4.15;


import "./ERC20.sol";
import "./Multivest.sol";


contract RyftsICO is ERC20, Multivest {
    uint256 public icoSince;
    uint256 public icoTill;
    uint256 public allocatedTokensForSale;
    uint256 public soldTokens;
    uint256 public goalMinSoldTokens;
    uint256 public tokenPrice;  // 333333333333333
    uint256 public collectedEthers;
    uint256 public minContribution;
    uint256 public maxContribution;

    bool public isIcoFinished;
    bool public isRefundAllowed;
    bool public multivestActive;

    mapping (address => uint256) public sentEthers;

    event Refund(address holder, uint256 ethers, uint256 tokens);

    function RyftsICO(
        uint256 _tokenPrice,
        address _reserveAccount,
        uint256 _reserveAmount,
        uint256 _icoSince,
        uint256 _icoTill,
        uint256 _goalMinSoldTokens,
        uint256 _initialSupply,
        string _tokenName,
        string _tokenSymbol,
        address _multivestMiddleware,
        bool _locked
    )
        public
        ERC20(_initialSupply, _tokenName, 8, _tokenSymbol, false, _locked)
        Multivest(_multivestMiddleware)
    {
        standard = "Ryfts 0.1";
        icoSince = _icoSince;
        icoTill = _icoTill;
        goalMinSoldTokens = _goalMinSoldTokens;
        tokenPrice = _tokenPrice;

        require(_reserveAmount <= _initialSupply);

        balanceOf[_reserveAccount] = _reserveAmount;
        balanceOf[this] -= balanceOf[_reserveAccount];

        allocatedTokensForSale = balanceOf[this];
    
        Transfer(this, _reserveAccount, balanceOf[_reserveAccount]);
    }

    function() external payable {
        require(false == multivestActive);
        bool status = buy(msg.sender, block.timestamp, msg.value);

        require(status == true);

        sentEthers[msg.sender] += msg.value;
    }

    function getBonusAmount(uint256 time, uint256 amount) public constant returns (uint256) {
        if (time < icoSince) {
            return 0;
        }

        if (time - icoSince <= 10800) {// 3h since ico => reward 25%
            return amount * 25 / 100;
        } else if (time - icoSince <= 21600) {// 6h since ico => reward 15%
            return amount * 15 / 100;
        } else if (time - icoSince <= 32400) {// 9h since ico => reward 5%
            return amount * 5 / 100;
        }

        return 0;
    }

    function setTokenPrice(uint256 _value) public onlyOwner {
        tokenPrice = _value;
    }

    function setICOPeriod(uint256 _icoSince, uint256 _icoTill) public onlyOwner {
        icoSince = _icoSince;
        icoTill = _icoTill;
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function icoFinished() public returns (bool) {
        if (isIcoFinished == true) {
            return true;
        }

        if (block.timestamp > icoTill || balanceOf[this] == 0) {
            if (soldTokens >= goalMinSoldTokens) {
                isRefundAllowed = false;
            } else {
                isRefundAllowed = true;
            }

            isIcoFinished = true;

            balanceOf[this] = 0;
        }

        return isIcoFinished;
    }

    function refund() public returns (bool) {
        return refundInternal(msg.sender);
    }

    function refundFor(address holder) public returns (bool) {
        return refundInternal(holder);
    }

    function transferEthers() public onlyOwner {
        if (isIcoFinished == true && isRefundAllowed == false) {
            owner.transfer(this.balance);
        }
    }

    function setMultivestStatus(bool _value) public onlyOwner {
        multivestActive = _value;
    }

    function setMinMaxContribution(uint256 _min, uint256 _max) public onlyOwner {
        require(minContribution <= maxContribution);

        minContribution = _min;
        maxContribution = _max;
    }

    /* solhint-disable code-complexity */
    function buy(address _address, uint256 time, uint256 _value) internal returns (bool) {
        if (locked == true) {
            return false;
        }

        if (time < icoSince) {
            return false;
        }

        if (time > icoTill) {
            return false;
        }

        if (_value == 0) {
            return false;
        }

        if (false == checkValuePermission(_value)) {
            return false;
        }

        uint256 amount = _value * (uint256(10) ** decimals) / tokenPrice;

        if (amount == 0) {
            return false;
        }

        soldTokens += amount;

        uint256 totalAmount = amount + getBonusAmount(block.timestamp, amount);

        if (balanceOf[this] < totalAmount) {
            return false;
        }

        if (balanceOf[_address] + totalAmount < balanceOf[_address]) {
            return false;
        }

        balanceOf[this] -= totalAmount;
        balanceOf[_address] += totalAmount;

        collectedEthers += _value;

        Contribution(_address, _value, totalAmount);

        return true;
    }
    /* solhint-enable code-complexity */

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        require(isIcoFinished == true && isRefundAllowed == false);

        return super.transferInternal(_from, _to, _value);
    }

    function refundInternal(address holder) internal returns (bool success) {
        if (isIcoFinished == true && isRefundAllowed == true) {
            uint256 refundEthers = sentEthers[holder];
            uint256 refundTokens = balanceOf[holder];

            if (refundEthers == 0 && refundTokens == 0) {
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

    function checkValuePermission(uint256 _value) internal returns (bool) {
        if (minContribution == 0 && maxContribution == 0) {
            return true;
        }

        if (minContribution <= _value && _value <= maxContribution) {
            return true;
        }

        if (_value > maxContribution && maxContribution != 0) {
            return false;
        }

        if (_value < minContribution && maxContribution != 0) {
            return false;
        }

        return true;
    }

}
