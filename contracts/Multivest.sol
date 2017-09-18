pragma solidity ^0.4.13;

import './Ownable.sol';

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