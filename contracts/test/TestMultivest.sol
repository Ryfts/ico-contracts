pragma solidity 0.4.21;

import "../Multivest.sol";
import "../Token.sol";


contract TestMultivest is Multivest, Token {
    function TestMultivest(address allowedMultivest) public
        Token(
            1000000,
            "TEST",
            18,
            "TST",
            false,
            false
        )
        Multivest(allowedMultivest)
    {
    }

    function buy(address _address, uint256, uint256 value) internal returns (bool) {
        return transferInternal(this, _address, value);
    }
}