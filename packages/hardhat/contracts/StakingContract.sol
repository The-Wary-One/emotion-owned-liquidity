// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

import {ERC4626} from "./ModifiedERC4626.sol";
import {InfusedToken, TokenId} from "./InfusedToken.sol";

/// @notice Minimal ERC4626 tokenized Vault implementation.
/// @author Solmate (https://github.com/transmissions11/solmate/blob/main/src/mixins/ERC4626.sol)
abstract contract StakingContract is ERC4626 {

    InfusedToken public immutable infusedToken;

    mapping(TokenId => uint256) public sharesPerToken;
    mapping(TokenId => address) tokenOwner;

    constructor(
        InfusedToken _infusedToken,
        ERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset, _name, _symbol) {
        require(address(_infusedToken.asset()) == address(_asset));
        infusedToken = _infusedToken;
    }

    function stake(TokenId tokenId) external {
        require(sharesPerToken[tokenId] == 0, "Token already staked");
        require(address(infusedToken.stakedAt(tokenId)) == address(this), "Token not staked here");
        uint256 assets = asset.balanceOf(address(this));
        require(assets >= infusedToken.infusedAmount(tokenId), "Infused fungible tokens not transfered for staking");

        address receiver = infusedToken.ownerOf(TokenId.unwrap(tokenId));
        // Check for rounding error since we round down in previewDeposit.
        uint256 shares = previewDeposit(assets);
        require(shares != 0, "ZERO_SHARES");

        _mint(address(infusedToken), shares);
        sharesPerToken[tokenId] = shares;
        tokenOwner[tokenId] = receiver;

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function unstake(TokenId tokenId) external {
        uint256 shares = sharesPerToken[tokenId];
        require(shares > 0, "Token not staked");
        require(address(infusedToken.stakedAt(tokenId)) == address(0), "Token not ready to be unstaked");

        address receiver = tokenOwner[tokenId];
        redeem(shares, receiver, address(infusedToken));

        delete sharesPerToken[tokenId];
        delete tokenOwner[tokenId];
    }
}
