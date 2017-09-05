pragma solidity ^0.4.13;


import './Ownable.sol';


/*
    ERC20 compatible smart contract
    without approve and transferFrom
*/
contract LoggedERC20 is Ownable {
    /* Structures */
    struct LogValueBlock {
    uint256 value;
    uint256 block;
    }

    /* Public variables of the token */
    string public standard = 'LogValueBlockToken 0.1';

    string public name;

    string public symbol;

    uint8 public decimals;

    LogValueBlock[] public loggedTotalSupply;

    bool public locked;

    uint256 public creationBlock;

    /* This creates an array with all balances */
    mapping (address => uint256) public balances;

    mapping (address => LogValueBlock[]) public loggedBalances;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed from, address indexed to, uint256 value);

    mapping (address => bool) public frozenAccount;

    /* This generates a public event on the blockchain that will notify clients */
    event FrozenFunds(address target, bool frozen);

    modifier onlyPayloadSize(uint numwords) {
        assert(msg.data.length == numwords * 32 + 4);
        _;
    }

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function LoggedERC20(
    uint256 initialSupply,
    string tokenName,
    uint8 decimalUnits,
    string tokenSymbol,
    bool transferAllSupplyToOwner,
    bool _locked
    ) {
        loggedTotalSupply.push(LogValueBlock(initialSupply, block.number));

        if (transferAllSupplyToOwner) {
            setBalance(msg.sender, initialSupply);

            Transfer(0, msg.sender, initialSupply);
        }
        else {
            setBalance(this, initialSupply);

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

    function valueAt(LogValueBlock [] storage valueBlocks, uint256 block) internal returns (uint256) {
        if (valueBlocks.length == 0) {
            return 0;
        }

        LogValueBlock memory prevLogValueBlock;

        for (uint256 i = 0; i < valueBlocks.length; i++) {

            LogValueBlock memory valueBlock = valueBlocks[i];

            if (valueBlock.block > block) {
                return prevLogValueBlock.value;
            }

            prevLogValueBlock = valueBlock;
        }

        return prevLogValueBlock.value;
    }

    function setBalance(address _address, uint256 value) internal {
        balances[_address] = value;
        loggedBalances[_address].push(LogValueBlock(value, block.number));
    }

    function totalSupply() returns (uint256) {
        return valueAt(loggedTotalSupply, block.number);
    }

    function balanceOf(address _address) returns (uint256) {
        return balances[_address];
    }

    function transferInternal(address _from, address _to, uint256 value) internal returns (bool success) {
        uint256 balanceFrom = balanceOf(_from);
        uint256 balanceTo = balanceOf(_to);

        if (value == 0) {
            return false;
        }

        if (frozenAccount[_from] == true) {
            return false;
        }

        if (balanceFrom < value) {
            return false;
        }

        if (balanceTo + value <= balanceTo) {
            return false;
        }

        if (_from == _to) {
            balanceTo = balanceTo - value;
        }

        setBalance(_from, balanceFrom - value);
        setBalance(_to, balanceTo + value);

        Transfer(_from, _to, value);

        return true;
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) onlyPayloadSize(2) {
        require(locked == false);

        bool status = transferInternal(msg.sender, _to, _value);

        require(status == true);
    }
}