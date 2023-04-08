/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import {StakingContract} from "./StakingContract.sol";
import {NFTRenderer} from "./libraries/NFTRenderer.sol";

type TokenId is uint256;

contract InfusedToken is ERC721, ERC721Enumerable {

    ERC20 immutable public asset;

    mapping(TokenId => uint256) public infusedAmount;
    mapping(TokenId => StakingContract) public stakedAt;

    constructor(string memory name_, string memory symbol_, ERC20 infusedFungibleToken_) ERC721(name_, symbol_) {
        asset = infusedFungibleToken_;
    }

    function mint(uint256 amountToInfuse) external {
        require(amountToInfuse != 0, "Insufficient fungible token to infuse");

        asset.transferFrom(msg.sender, address(this), amountToInfuse);

        TokenId newTokenId = TokenId.wrap(totalSupply() + 1);
        _safeMint(msg.sender, TokenId.unwrap(newTokenId));

        infusedAmount[newTokenId] = amountToInfuse;
    }

    function stake(TokenId tokenId, StakingContract stakingContract) external {
        require(ownerOf(TokenId.unwrap(tokenId)) == msg.sender, "Cannot stake someone else token");
        require(address(stakedAt[tokenId]) == address(0), "Token already staked");
        require(address(stakingContract.asset()) == address(asset), "Incompatible staking contract asset");

        stakedAt[tokenId] = stakingContract;

        asset.transfer(address(stakingContract), infusedAmount[tokenId]);
        stakingContract.stake(tokenId);
    }

    function burn(TokenId tokenId) external {
        require(ownerOf(TokenId.unwrap(tokenId)) == msg.sender, "Cannot burn someone else token");

        uint256 _infusedAmount = infusedAmount[tokenId];
        StakingContract _stakedAt = stakedAt[tokenId];

        _burn(TokenId.unwrap(tokenId));
        delete infusedAmount[tokenId];
        delete stakedAt[tokenId];


        if (address(_stakedAt) != address(0)) {
            uint256 previousBalance = asset.balanceOf(msg.sender);

            _stakedAt.unstake(tokenId);

            uint256 refund = asset.balanceOf(msg.sender) - previousBalance;
            assert(refund >= _infusedAmount);
        } else {
            uint256 refund = _infusedAmount;
            asset.transfer(msg.sender, refund);
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token doesn't exist");
        return NFTRenderer.render(NFTRenderer.RenderParams({
            asset: asset,
            staked: address(stakedAt[TokenId.wrap(tokenId)]) != address(0),
            amount: infusedAmount[TokenId.wrap(tokenId)]
        }));
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != address(0) && to != address(0)) {
            require(address(stakedAt[TokenId.wrap(tokenId)]) == address(0), "Cannot transfer a staked token");
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
