// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IPerpetualManager.sol";
import "./IVault.sol";

contract PerpetualManager is IPerpetualManager {
    struct Position {
        int256 size;
        uint256 margin;
        uint256 entryPrice;
        bool isLong;
    }

    mapping(address => Position) public positions;
    IVault public vault;
    address public owner;

    event PositionOpened(address indexed user, bool isLong, uint256 margin, uint256 leverage, uint256 entryPrice);
    event PositionClosed(address indexed user, int256 pnl);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _vault) {
        vault = IVault(_vault);
        owner = msg.sender;
    }

    function setVault(address _vault) external onlyOwner {
        vault = IVault(_vault);
    }

    // User-facing deposit function
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        vault.deposit(msg.sender, msg.value);
        emit Deposited(msg.sender, msg.value);
    }

    // User-facing withdraw function  
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        vault.withdraw(msg.sender, amount);
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    // Get user's collateral balance
    function getCollateral(address user) external view returns (uint256) {
        return vault.getCollateral(user);
    }

    function openPosition(address user, bool isLong, uint256 margin, uint256 leverage) external override {
        require(positions[user].margin == 0, "Position exists");
        // For simplicity, entryPrice is set to 1000 (mocked)
        uint256 entryPrice = 1000;
        positions[user] = Position({
            size: int256(margin * leverage),
            margin: margin,
            entryPrice: entryPrice,
            isLong: isLong
        });
        vault.deposit(user, margin);
        emit PositionOpened(user, isLong, margin, leverage, entryPrice);
    }

    function closePosition(address user) external override {
        Position storage pos = positions[user];
        require(pos.margin > 0, "No position");
        // For simplicity, exit price is set to 1000 (mocked)
        uint256 exitPrice = 1000;
        int256 pnl = int256(pos.size) * int256(exitPrice - pos.entryPrice) / int256(pos.entryPrice);
        vault.withdraw(user, pos.margin);
        delete positions[user];
        emit PositionClosed(user, pnl);
    }

    function getPosition(address user) external view override returns (int256 size, uint256 margin, uint256 entryPrice, bool isLong) {
        Position memory pos = positions[user];
        return (pos.size, pos.margin, pos.entryPrice, pos.isLong);
    }
}
