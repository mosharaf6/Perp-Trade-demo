// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IFundingRate.sol";

contract FundingRate is IFundingRate {
    mapping(address => int256) public fundingPayments;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function updateFunding() external override onlyOwner {
        // Mock logic: increment funding payment for demonstration
        // In production, this would use price/time data
        fundingPayments[msg.sender] += 1;
    }

    function getFundingPayment(address user) external view override returns (int256) {
        return fundingPayments[user];
    }
}
