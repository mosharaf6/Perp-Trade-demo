// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Governance {
    address public owner;
    mapping(bytes32 => uint256) public parameters;

    event ParameterChanged(bytes32 indexed key, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setParameter(bytes32 key, uint256 value) external onlyOwner {
        parameters[key] = value;
        emit ParameterChanged(key, value);
    }

    function getParameter(bytes32 key) external view returns (uint256) {
        return parameters[key];
    }
}
