// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IFeeManager.sol";

contract FeeManager is IFeeManager {
    uint256 public collectedFees;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function collectFee(address /*user*/, uint256 amount) external override onlyOwner {
        collectedFees += amount;
    }

    function getCollectedFees() external view override returns (uint256) {
        return collectedFees;
    }
}
