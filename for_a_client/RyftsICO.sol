pragma solidity ^0.4.13;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    function Ownable() {
        owner = msg.sender;
    }


    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }


    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    address newOwner;
    function transferOwnership(address _newOwner) onlyOwner {
        if (_newOwner != address(0)) {
            newOwner = _newOwner;
        }
    }

    function acceptOwnership() {
        if (msg.sender == newOwner) {
            owner = newOwner;
        }
    }
}

contract tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData); }

contract Multivest is Ownable {
    /* public variables */
    mapping(address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);
    event MultivestUnset(address multivest);

    /* modifier */
    modifier onlyPayloadSize(uint numwords) {
        assert(msg.data.length == numwords * 32 + 4);
        _;
    }

    /* constructor */
    function Multivest(address multivest) {
        allowedMultivests[multivest] = true;
    }

    /* public methods */
    function setAllowedMultivest(address _address) onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) onlyOwner {
        allowedMultivests[_address] = false;
    }

    function buy(address _address, uint256 time, uint256 value) internal returns (bool);

    function multivestBuy(address holder, uint256 value) onlyPayloadSize(2) {
        require(allowedMultivests[msg.sender] == true);

        bool status = buy(holder, now, value);

        require(status == true);
    }
}
/*
    ERC20 compatible smart contract
    without approve and transferFrom
*/
contract ERC20 is Ownable {
    /* Public variables of the token */
    string public standard = 'ERC20 0.1';

    string public name;

    string public symbol;

    uint8 public decimals;

    uint256 public totalSupply;

    bool public locked;

    uint256 public creationBlock;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    mapping (address => mapping (address => uint256)) public allowance;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed from, address indexed to, uint256 value);

    modifier onlyPayloadSize(uint numwords) {
        assert(msg.data.length == numwords * 32 + 4);
        _;
    }

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function ERC20(
    uint256 initialSupply,
    string tokenName,
    uint8 decimalUnits,
    string tokenSymbol,
    bool transferAllSupplyToOwner,
    bool _locked
    ) {
        totalSupply = initialSupply;

        if (transferAllSupplyToOwner) {
            balanceOf[msg.sender] = initialSupply;

            Transfer(0, msg.sender, initialSupply);
        }
        else {
            balanceOf[this] = initialSupply;

            Transfer(0, this, initialSupply);
        }

        name = tokenName;
        // Set the name for display purposes
        symbol = tokenSymbol;
        // Set the symbol for display purposes
        decimals = decimalUnits;
        // Amount of decimals for display purposes
        locked = _locked;
        creationBlock = block.number;
    }

    function transferInternal(address _from, address _to, uint256 value) internal returns (bool success) {
        if (value == 0) {
            return false;
        }

        if (balanceOf[_from] < value) {
            return false;
        }

        if (balanceOf[_to] + value <= balanceOf[_to]) {
            return false;
        }

        balanceOf[_from] -= value;
        balanceOf[_to] += value;

        Transfer(_from, _to, value);

        return true;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) onlyPayloadSize(2) {
        require(locked == false);

        bool status = transferInternal(msg.sender, _to, _value);

        require(status == true);
    }

    /* Approve */
    function approve(address _spender, uint256 _value) onlyPayloadSize(2) returns (bool success) {
        if(locked) {
            return false;
        }

        allowance[msg.sender][_spender] = _value;

        return true;
    }

    /* Approve and then communicate the approved contract in a single tx */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) returns (bool success) {
        if (locked) {
            return false;
        }
        tokenRecipient spender = tokenRecipient(_spender);
        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }

    /* A contract attempts to get the coins */
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        if (locked) {
            return false;
        }

        if (allowance[_from][msg.sender] < _value) {
            return false;
        }

        bool _success = transferInternal(_from, _to, _value);

        if (_success) {
            allowance[_from][msg.sender] -= _value;
        }

        return _success;
    }

}

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
