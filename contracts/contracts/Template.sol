// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Template {
    address public owner;
    uint256 public value;

    event ValueChanged(uint256 newValue);

    constructor(uint256 _value) {
        owner = msg.sender;
        value = _value;
    }

    function setValue(uint256 _value) public {
        require(msg.sender == owner, "Only owner can set value");
        value = _value;
        emit ValueChanged(_value);
    }
}
