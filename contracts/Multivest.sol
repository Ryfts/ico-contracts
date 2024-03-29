pragma solidity 0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Multivest is Ownable {
    /* public variables */
    mapping(address => bool) public allowedMultivests;

    /* events */
    event Contribution(address _holder, uint256 value, uint256 tokens);
    
    /* modifier */
    modifier onlyPayloadSize(uint size) {
        assert(msg.data.length >= size + 4);
        _;
    }

    modifier onlyAllowedMultivests() {
        require(true == allowedMultivests[msg.sender]);
        _;
    }

    /* constructor */
    function Multivest(address multivest) public {
        allowedMultivests[multivest] = true;
    }

    /* public methods */
    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
    }

    function multivestBuy(address holder, uint256 value) public onlyPayloadSize(2) onlyAllowedMultivests {
        bool status = buy(holder, block.timestamp, value);
        require(status == true);
    }

    function buy(address _address, uint256 time, uint256 value) internal returns (bool);
}