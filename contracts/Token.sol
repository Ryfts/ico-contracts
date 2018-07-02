pragma solidity 0.4.21;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";


/*
    ERC20 compatible smart contract
*/
contract Token is StandardToken {
    /* Public variables of the token */
    string public name;

    string public version = "0.1";

    string public symbol;

    uint8 public decimals;

    uint256 public creationBlock;

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function Token(
        uint256 initialSupply,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol,
        bool transferAllSupplyToOwner
    ) public {
        totalSupply_ = initialSupply;

        if (transferAllSupplyToOwner) {
            balances[msg.sender] = initialSupply;
        } else {
            balances[this] = initialSupply;
        }

        // Set the name for display purposes
        name = tokenName;
        // Set the symbol for display purposes
        symbol = tokenSymbol;
        // Amount of decimals for display purposes
        decimals = decimalUnits;
        // Set creation block
        creationBlock = block.number;
    }

    function transferInternal(address _from, address _to, uint256 _value) internal returns (bool success) {
        if (_value == 0) {
            emit Transfer(_from, _to, 0);

            return true;
        }

        if (balances[_from] < _value) {
            return false;
        }

        if (balances[_to] + _value <= balances[_to]) {
            return false;
        }

        balances[_from] -= _value;
        balances[_to] += _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        if (allowed[_from][msg.sender] < _value) {
            return false;
        }

        bool _success = transferInternal(_from, _to, _value);

        if (_success) {
            allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
            emit Transfer(_from, _to, _value);
        }

        return _success;
    }
}