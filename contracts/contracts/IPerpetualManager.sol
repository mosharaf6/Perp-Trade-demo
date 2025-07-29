// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPerpetualManager {
    function openPosition(address user, bool isLong, uint256 margin, uint256 leverage) external;
    function closePosition(address user) external;
    function getPosition(address user) external view returns (int256 size, uint256 margin, uint256 entryPrice, bool isLong);
}
