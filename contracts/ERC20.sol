pragma solidity 0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


/*
    ERC20 compatible smart contract
*/
contract ERC20 is Ownable {
    /* Public variables of the token */
    string public standard = "ERC20 0.1";

    string public name;

    string public symbol;

    uint8 public decimals;

    uint256 public totalSupply_;

    bool public locked;

    uint256 public creationBlock;

    /* This creates an array with all balances */
    mapping (address => uint256) public balances;

    mapping (address => mapping (address => uint256)) public allowance;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length >= size + 4);
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
    ) public {
        totalSupply_ = initialSupply;

        if (transferAllSupplyToOwner) {
            balances[msg.sender] = initialSupply;
            emit Transfer(address(0), msg.sender, initialSupply);
        } else {
            balances[this] = initialSupply;
            emit Transfer(address(0), this, initialSupply);
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

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function totalSupply() public view returns (uint256 totalSupply) {
        return totalSupply_;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) public onlyPayloadSize(2) returns (bool success) {
        require(locked == false);

        bool status = transferInternal(msg.sender, _to, _value);

        require(status == true);

        return status;
    }

    /* Approve */
    function approve(address _spender, uint256 _value) public onlyPayloadSize(2) returns (bool success) {
        if (locked) {
            return false;
        }

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    /* A contract attempts to get the coins */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
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

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        if (_value == 0) {
            emit Transfer(_from, _to, 0);

            return true;
        }

        if (balanceOf[_from] < _value) {
            return false;
        }

        if (balanceOf[_to] + _value <= balanceOf[_to]) {
            return false;
        }

        balances[_from] -= _value;
        balances[_to] += _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

}