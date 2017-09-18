pragma solidity ^0.4.13;


import './Ownable.sol';

contract tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData); }

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
