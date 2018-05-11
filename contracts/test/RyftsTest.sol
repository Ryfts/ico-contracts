pragma solidity 0.4.21;


import "../Ryfts.sol";


contract RyftsTest is Ryfts {
    function RyftsTest(
    address _reserveAccount,
    uint256 _reserveAmount,
    uint256 _initialSupply,
    string _tokenName,
    string _tokenSymbol,
    address _multivestMiddleware,
    bool _locked
    ) public
    Ryfts(_reserveAccount, _reserveAmount, _initialSupply, _tokenName, _tokenSymbol, _multivestMiddleware, _locked)
    {

    }

    function checkValuePermissionTest(uint8 _phaseId, uint256 _value) public returns (bool) {
        return checkValuePermission(_phaseId, _value);
    }
}
