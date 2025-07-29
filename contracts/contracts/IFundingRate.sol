// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFundingRate {
    function updateFunding() external;
    function getFundingPayment(address user) external view returns (int256);
}
