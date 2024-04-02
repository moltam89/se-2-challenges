// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;  //Do not change the solidity version as it negativly impacts submission grading

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {
    uint public constant threshold = 1 ether;

    mapping (address => uint) public balances;

    event Stake(address, uint);

    uint public deadline = block.timestamp + 30 seconds;

    bool public openForWithDraw = false;

    ExampleExternalContract public exampleExternalContract;

    constructor(address exampleExternalContractAddress) {
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    }

    // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
    // (Make sure to add a `Stake(address,uint256)` event and emit it for the frontend `All Stakings` tab to display)

    function stake() external payable {
        balances[msg.sender] += msg.value;

        emit Stake(msg.sender, msg.value);
    }

    // After some `deadline` allow anyone to call an `execute()` function
    // If the deadline has passed and the threshold is met, it should call `exampleExternalContract.complete{value: address(this).balance}()`

    function execute() external {
        require(block.timestamp > deadline, "You cannot execute yet");

        uint contractBalance = address(this).balance;

        if (contractBalance >= threshold) {
            exampleExternalContract.complete{value: contractBalance}();
        }
        else {
            openForWithDraw = true;
        }
    }

    // If the `threshold` was not met, allow everyone to call a `withdraw()` function to withdraw their balance

    function withdraw() external {
        require(openForWithDraw, "You cannot withdraw");

        uint userBalance = balances[msg.sender];

        balances[msg.sender] = 0;

        payable(msg.sender).transfer(userBalance);
    }


    // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend


    // Add the `receive()` special function that receives eth and calls stake()

}
