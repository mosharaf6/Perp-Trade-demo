// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVault.sol";

contract Vault is IVault {
    mapping(address => uint256) private collateral;
    address public perpManager;
    address public owner;

    modifier onlyPerpManager() {
        require(msg.sender == perpManager, "Not authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _perpManager) {
        perpManager = _perpManager;
        owner = msg.sender;
    }

    function setPerpManager(address _perpManager) external onlyOwner {
        perpManager = _perpManager;
    }

    function deposit(address user, uint256 amount) external payable override onlyPerpManager {
        require(msg.value == amount, "ETH amount mismatch");
        collateral[user] += amount;
    }

    function withdraw(address user, uint256 amount) external override onlyPerpManager {
        require(collateral[user] >= amount, "Insufficient collateral");
        collateral[user] -= amount;
        // ETH will be sent by PerpetualManager
    }

    function getCollateral(address user) external view override returns (uint256) {
        return collateral[user];
    }

    function liquidate(address user) external override onlyPerpManager {
        collateral[user] = 0;
    }
}
