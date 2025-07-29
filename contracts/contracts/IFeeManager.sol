// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFeeManager {
    function collectFee(address user, uint256 amount) external;
    function getCollectedFees() external view returns (uint256);
}
