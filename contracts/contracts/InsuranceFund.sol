// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IInsuranceFund.sol";

contract InsuranceFund is IInsuranceFund {
    uint256 public balance;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit(uint256 amount) external override onlyOwner {
        balance += amount;
    }

    function coverBadDebt(address /*user*/, uint256 amount) external override onlyOwner {
        require(balance >= amount, "Insufficient fund");
        balance -= amount;
    }

    function getBalance() external view override returns (uint256) {
        return balance;
    }
}
