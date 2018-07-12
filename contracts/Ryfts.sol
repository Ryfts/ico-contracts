pragma solidity 0.4.21;


import "./Token.sol";
import "./Multivest.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract Ryfts is Token, Multivest {
    using SafeMath for uint256;

    uint256 public allocatedTokensForSale;
    uint256 public collectedEthers;
    bool public isRefundAllowed;
    bool public whitelistActive;
    bool public phasesSet;

    bool public locked;

    mapping (address => uint256) public sentEthers;

    Phase[] public phases;

    struct Phase {
        uint256 price;
        uint256 since;
        uint256 till;
        uint256 allocatedTokens;
        // min. goal of tokens sold including bonuses
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
        Token(_initialSupply, _tokenName, 18, _tokenSymbol, false)
        Multivest(_multivestMiddleware)
    {
        require(_reserveAmount <= _initialSupply);

        // lock sale
        locked = _locked;

        balances[_reserveAccount] = _reserveAmount;
        balances[this] = balanceOf(this).sub(balanceOf(_reserveAccount));

        allocatedTokensForSale = balanceOf(this);
    
        emit Transfer(this, _reserveAccount, balanceOf(_reserveAccount));
    }

    function() public payable {
        bool status = buy(msg.sender, block.timestamp, msg.value);
        require(status == true);

        sentEthers[msg.sender] = sentEthers[msg.sender].add(msg.value);
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
        require(_minPreIcoContribution <= _maxPreIcoContribution);
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
            return amount.mul(25).div(100);
        } else if (time - phase.since <= 21600) {// 6h since ico => reward 15%
            return amount.mul(15).div(100);
        } else if (time - phase.since <= 32400) {// 9h since ico => reward 5%
            return amount.mul(5).div(100);
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
        // restrict changing phase after it begins
        require(now < phase.since);

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

        uint256 unsoldTokens = phase.allocatedTokens.sub(phase.soldTokens);

        if (block.timestamp > phase.till || phase.allocatedTokens == phase.soldTokens || balanceOf(this) == 0) {
            if (_phaseId == 1) {
                balances[this] = 0;
                emit Transfer(this, address(0), unsoldTokens);

                if (phase.soldTokens >= phase.goalMinSoldTokens) {
                    isRefundAllowed = false;
                } else {
                    isRefundAllowed = true;
                }
            }
            if (_phaseId == 0) {
                if (unsoldTokens > 0) {
                    transferUnusedTokensToICO(unsoldTokens);
                    phase.allocatedTokens = phase.soldTokens;
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
            owner.transfer(address(this).balance);
        } else {
            owner.transfer(address(this).balance);
        }
    }

    function setWhitelistStatus(bool _value) public onlyOwner {
        whitelistActive = _value;
    }

    function setMinMaxContribution(uint8 _phaseId, uint256 _min, uint256 _max) public onlyOwner {
        require(phases.length > _phaseId);
        Phase storage phase = phases[_phaseId];
        require(_min <= _max || _max == 0);

        phase.minContribution = _min;
        phase.maxContribution = _max;
    }

    function calculateTokensAmount(address _address, uint256 _time, uint256 _value) public constant returns(uint256) {
        uint8 currentPhase = getCurrentPhase(_time);
        Phase storage phase = phases[currentPhase];

        if (true == whitelistActive && phase.whitelist[_address] == false) {
            return 0;
        }

        if (phase.isFinished) {
            return 0;
        }

        if (false == checkValuePermission(currentPhase, _value)) {
            return 0;
        }

        return _value.mul(uint256(10) ** decimals).div(phase.price);
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
    function buy(address _address, uint256 _time, uint256 _value) internal returns (bool) {
        if (locked == true) {
            return false;
        }
        uint8 currentPhase = getCurrentPhase(_time);
        Phase storage phase = phases[currentPhase];
        if (_value == 0) {
            return false;
        }

        uint256 amount = calculateTokensAmount(_address, _time, _value);

        if (amount == 0) {
            return false;
        }

        uint256 totalAmount = amount.add(getBonusAmount(_time, amount));

        if (phase.allocatedTokens < phase.soldTokens + totalAmount) {
            return false;
        }

        phase.soldTokens = phase.soldTokens.add(totalAmount);

        if (balanceOf(this) < totalAmount) {
            return false;
        }

        if (balanceOf(_address) + totalAmount < balanceOf(_address)) {
            return false;
        }

        balances[this] = balanceOf(this).sub(totalAmount);
        balances[_address] = balanceOf(_address).add(totalAmount);

        collectedEthers = collectedEthers.add(_value);

        emit Contribution(_address, _value, totalAmount);
        emit Transfer(this, _address, totalAmount);
        return true;
    }

    function refundInternal(address holder) internal returns (bool success) {
        Phase storage phase = phases[1];
        require(phase.isFinished == true && isRefundAllowed == true);
        uint256 refundEthers = sentEthers[holder];
        uint256 refundTokens = balanceOf(holder);

        if (refundEthers == 0 && refundTokens == 0) {
            return false;
        }

        balances[holder] = 0;
        sentEthers[holder] = 0;

        if (refundEthers > 0) {
            holder.transfer(refundEthers);
        }

        emit Refund(holder, refundEthers, refundTokens);

        return true;
    }

    function transferUnusedTokensToICO(uint256 _unsoldPreICO) internal {
        Phase storage phase = phases[1];
        phase.allocatedTokens = phase.allocatedTokens.add(_unsoldPreICO);
    }

    function checkValuePermission(uint8 _phaseId, uint256 _value) internal view returns (bool) {
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

        if (_value < phase.minContribution) {
            return false;
        }

        return false;
    }

}
