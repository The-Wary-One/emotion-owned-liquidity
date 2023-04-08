// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

contract sETH is ERC20 {

    constructor() ERC20("sETH", "sETH", 18) {}

    function mint(uint256 amount) external {
        _mint(msg.sender, amount);
    }
}
