// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {sETH} from "./sETH.sol";
import {StakingContract, InfusedToken, TokenId, ERC20} from "../StakingContract.sol";

contract Vault is StakingContract {

    constructor(
        InfusedToken _infusedToken,
        ERC20 _asset,
        string memory _name,
        string memory _symbol
    ) StakingContract(_infusedToken, _asset, _name, _symbol) {
    }

    function harvest() external {
        // Fake yield harvest.
        (bool success, ) = address(asset).call(abi.encodeWithSignature("mint(uint256)", 10e18));
        require(success);
    }

    function totalAssets() public view override returns (uint256) {
        return asset.balanceOf(address(this));
    }
}
