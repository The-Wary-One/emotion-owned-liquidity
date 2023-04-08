/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

library NFTRenderer {

    struct RenderParams {
        ERC20 asset;
        bool staked;
        uint256 amount;
    }

    function render(RenderParams memory params) internal view returns (string memory) {
        string memory symbol = params.asset.symbol();
        string memory amount = renderAmount(params.amount);

        string memory image = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 480'>",
            "<style>.asset { font: bold 30px sans-serif; }",
            ".amount { font: normal 26px sans-serif; }</style>",
            renderBackground(params.asset, params.staked),
            renderTop(symbol, amount),
            "</svg>"
        );

        string memory description = renderDescription(symbol, params.staked, amount);

        string memory json = string.concat(
            '{"name":"Infused token",',
            '"description":"',
            description,
            '",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(image)),
            '"}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function renderBackground(ERC20 asset, bool staked) internal pure returns (string memory) {
        bytes32 key = keccak256(abi.encodePacked(asset, staked));
        uint256 hue = uint256(key) % 360;

        return string.concat(
            '<rect width="300" height="480" fill="hsl(',
            Strings.toString(hue),
            ',40%,40%)"/>',
            '<rect x="30" y="30" width="240" height="420" rx="15" ry="15" fill="hsl(',
            Strings.toString(hue),
            ',100%,50%)" stroke="#000"/>'
        );
    }

    function renderTop(string memory symbol, string memory amount) internal pure returns (string memory) {
        return string.concat(
            '<rect x="30" y="87" width="240" height="42"/>',
            '<text x="39" y="120" class="asset" fill="#fff">',
            symbol,
            "</text>",
            '<rect x="30" y="132" width="240" height="30"/>',
            '<text x="39" y="120" dy="36" class="amount" fill="#fff">',
            amount,
            "</text>"
        );
    }

    function renderDescription(string memory symbol, bool staked, string memory amount) internal pure returns (string memory) {
        return string.concat(
            symbol,
            " ",
            amount,
            staked ? " staked" : ""
        );
    }

    function renderAmount(uint256 amount) internal pure returns (string memory) {
        if (amount >= 1 ether) {
            return Strings.toString(amount / 1 ether);
        } else if (amount >= 0.1 ether) {
            return string.concat("0.", Strings.toString(amount / 0.1 ether));
        } else if (amount >= 0.01 ether) {
            return string.concat("0.0", Strings.toString(amount / 0.01 ether));
        } else {
            return string.concat("0.00", Strings.toString(amount / 0.001 ether));
        }
    }
}
