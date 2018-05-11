pragma solidity 0.4.21;

import "../Multivest.sol";
import "../ERC20.sol";


contract TestMultivest is Multivest, ERC20 {
    function TestMultivest(address allowedMultivest) public
        ERC20(
            1000000,
            "TEST",
            18,
            "TST",
            false,
            false
        )
        Multivest(allowedMultivest)
    {
        standard = "TestMultivest 0.1";
    }

    function buy(address _address, uint256, uint256 value) internal returns (bool) {
        return transferInternal(this, _address, value);
    }
}