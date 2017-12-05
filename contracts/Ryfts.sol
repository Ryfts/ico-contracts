pragma solidity 0.4.15;


import "./ERC20.sol";
import "./Multivest.sol";


contract Ryfts is ERC20, Multivest {

    uint256 public allocatedTokensForSale;
    uint256 public collectedEthers;
    bool public isRefundAllowed;
    bool public whitelistActive;
    bool public phasesSet;

    mapping (address => uint256) public sentEthers;

    Phase[] public phases;

    struct Phase {
        uint256 price;
        uint256 since;
        uint256 till;
        uint256 allocatedTokens;
        uint256 goalMinSoldTokens;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 soldTokens;
        bool isFinished;
        mapping (address => bool) whitelist;
    }

    event Refund(address holder, uint256 ethers, uint256 tokens);

    function Ryfts(
        address _reserveAccount,
        uint256 _reserveAmount,
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
        require(_reserveAmount <= _initialSupply);

        balanceOf[_reserveAccount] = _reserveAmount;
        balanceOf[this] -= balanceOf[_reserveAccount];

        allocatedTokensForSale = balanceOf[this];
    
        Transfer(this, _reserveAccount, balanceOf[_reserveAccount]);
    }

    function setSalePhases(
        uint256 _preIcoTokenPrice,
        uint256 _preIcoSince,
        uint256 _preIcoTill,
        uint256 _allocatedTokensForPreICO,
        uint256 _minPreIcoContribution,
        uint256 _maxPreIcoContribution,

        uint256 _icoTokenPrice,
        uint256 _icoSince,
        uint256 _icoTill,
        uint256  _goalIcoMinSoldTokens
    ) public onlyOwner {
        require(phasesSet == false);
        require(_allocatedTokensForPreICO < allocatedTokensForSale);
        require(_goalIcoMinSoldTokens <= allocatedTokensForSale - _allocatedTokensForPreICO);
        require((_preIcoSince < _preIcoTill) && (_icoSince < _icoTill) && (_preIcoTill <= _icoSince));
        require(_minPreIcoContribution <= _minPreIcoContribution);
        phasesSet = true;
        phases.push(
            Phase(
                _preIcoTokenPrice,
                _preIcoSince,
                _preIcoTill,
                _allocatedTokensForPreICO,
                0,
                _minPreIcoContribution,
                _maxPreIcoContribution,
                0,
                false
            )
        );
        phases.push(
            Phase(
                _icoTokenPrice,
                _icoSince,
                _icoTill,
                allocatedTokensForSale - _allocatedTokensForPreICO,
                _goalIcoMinSoldTokens,
                0,
                0,
                0,
                false
            )
        );
    }

    function() public payable {
        bool status = buy(msg.sender, block.timestamp, msg.value);
        require(status == true);

        sentEthers[msg.sender] += msg.value;
    }

    function getCurrentPhase(uint256 _time) public constant returns (uint8) {
        require(phasesSet == true);
        if (_time == 0) {
            return uint8(phases.length);
        }
        for (uint8 i = 0; i < phases.length; i++) {
            Phase storage phase = phases[i];
            if (phase.since > _time) {
                continue;
            }

            if (phase.till < _time) {
                continue;
            }

            return i;
        }

        return uint8(phases.length);
    }

    function getBonusAmount(uint256 time, uint256 amount) public constant returns (uint256) {
        uint8 currentPhase = getCurrentPhase(now);

        if (currentPhase != 1) {
            return 0;
        }
        Phase storage phase = phases[currentPhase];

        if (time - phase.since <= 10800) {// 3h since ico => reward 25%
            return amount * 25 / 100;
        } else if (time - phase.since <= 21600) {// 6h since ico => reward 15%
            return amount * 15 / 100;
        } else if (time - phase.since <= 32400) {// 9h since ico => reward 5%
            return amount * 5 / 100;
        }

        return 0;
    }

    function addToWhitelist(uint8 _phaseId, address _address) public onlyOwner {

        require(phases.length > _phaseId);

        Phase storage phase = phases[_phaseId];

        phase.whitelist[_address] = true;

    }

    function removeFromWhitelist(uint8 _phaseId, address _address) public onlyOwner {

        require(phases.length > _phaseId);

        Phase storage phase = phases[_phaseId];

        phase.whitelist[_address] = false;
    }

    function setTokenPrice(uint8 _phaseId, uint256 _value) public onlyOwner {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        phase.price = _value;
    }

    function setPeriod(uint8 _phaseId, uint256 _since, uint256 _till) public onlyOwner {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        phase.since = _since;
        phase.till = _till;
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function finished(uint8 _phaseId) public returns (bool) {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];

        if (phase.isFinished == true) {
            return true;
        }

        if (block.timestamp > phase.till || balanceOf[this] == 0) {
            if (_phaseId == 1) {
                balanceOf[this] = 0;
                if (phase.soldTokens >= phase.goalMinSoldTokens) {
                    isRefundAllowed = false;
                } else {
                    isRefundAllowed = true;
                }
            }
            phase.isFinished = true;

        }

        return phase.isFinished;
    }

    function refund() public returns (bool) {
        return refundInternal(msg.sender);
    }

    function refundFor(address holder) public returns (bool) {
        return refundInternal(holder);
    }

    function transferEthers() public onlyOwner {
        require(false == isActive(1));
        Phase storage phase = phases[1];
        if (phase.till <= block.timestamp) {
            require(phase.isFinished == true && isRefundAllowed == false);
            owner.transfer(this.balance);
        } else {
            owner.transfer(this.balance);
        }
    }

    function setWhitelistStatus(bool _value) public onlyOwner {
        whitelistActive = _value;
    }

    function setMinMaxContribution(uint8 _phaseId, uint256 _min, uint256 _max) public onlyOwner {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        require(_min <= _max);

        phase.minContribution = _min;
        phase.maxContribution = _max;
    }

    // @return true if sale period is active
    function isActive(uint8 _phaseId) public constant returns (bool) {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        if (phase.soldTokens > uint256(0) && phase.soldTokens == phase.allocatedTokens) {
            return false;
        }
        return withinPeriod(_phaseId);
    }

    // @return true if the transaction can buy tokens
    function withinPeriod(uint8 _phaseId) public constant returns (bool) {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        return block.timestamp >= phase.since && block.timestamp <= phase.till;
    }

    /* solhint-disable code-complexity */
    function buy(address _address, uint256 time, uint256 _value) internal returns (bool) {
        if (locked == true) {
            return false;
        }
        uint8 currentPhase = getCurrentPhase(time);
        Phase storage phase = phases[currentPhase];

        if (true == whitelistActive && phase.whitelist[_address] == false) {
            return false;
        }

        if (time < phase.since) {
            return false;
        }

        if (time > phase.till) {
            return false;
        }

        if (phase.isFinished) {
            return false;
        }

        if (_value == 0) {
            return false;
        }

        if (false == checkValuePermission(currentPhase, _value)) {
            return false;
        }

        uint256 amount = _value * (uint256(10) ** decimals) / phase.price;

        if (amount == 0) {
            return false;
        }

        phase.soldTokens += amount;
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
        Transfer(this, _address, totalAmount);
        return true;
    }
    /* solhint-enable code-complexity */

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        require(false == isActive(0));
        require(false == isActive(1));
        Phase storage phase = phases[1];
        require(phase.isFinished == true && isRefundAllowed == false);

        return super.transferInternal(_from, _to, _value);
    }

    function refundInternal(address holder) internal returns (bool success) {
        Phase storage phase = phases[1];
        require(phase.isFinished == true && isRefundAllowed == true);
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

    function checkValuePermission(uint8 _phaseId, uint256 _value) internal returns (bool) {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];

        if (phase.minContribution == 0 && phase.maxContribution == 0) {
            return true;
        }

        if (phase.minContribution <= _value && _value <= phase.maxContribution) {
            return true;
        }

        if (_value > phase.maxContribution && phase.maxContribution != 0) {
            return false;
        }

        if (_value < phase.minContribution && phase.maxContribution != 0) {
            return false;
        }

        return true;
    }

}
