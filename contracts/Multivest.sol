pragma solidity 0.4.15;


import "./Ownable.sol";


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
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function multivestBuy(address holder, uint256 value) public onlyPayloadSize(2) {
        require(allowedMultivests[msg.sender] == true);

        bool status = buy(holder, block.timestamp, value);
        
        require(status == true);
    }

    function buy(address _address, uint256 time, uint256 value) internal returns (bool);
}