// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInsuranceFund {
    function deposit(uint256 amount) external;
    function coverBadDebt(address user, uint256 amount) external;
    function getBalance() external view returns (uint256);
}
