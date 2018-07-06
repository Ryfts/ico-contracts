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
}