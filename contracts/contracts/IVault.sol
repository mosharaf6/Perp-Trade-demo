// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    function deposit(address user, uint256 amount) external payable;
    function withdraw(address user, uint256 amount) external;
    function getCollateral(address user) external view returns (uint256);
    function liquidate(address user) external;
}
