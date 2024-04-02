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

    modifier notCompleted {
        require(!exampleExternalContract.completed(), "Staking was successful, threshold was reached");
        _;
    }

    constructor(address exampleExternalContractAddress) {
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
    }

    // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
    // (Make sure to add a `Stake(address,uint256)` event and emit it for the frontend `All Stakings` tab to display)

    function stake() public payable {
        require(block.timestamp <= deadline, "Staking is over, the deadline is reached");

        require(msg.value > 0, "You have to send some eth");

        balances[msg.sender] += msg.value;

        emit Stake(msg.sender, msg.value);
    }

    // After some `deadline` allow anyone to call an `execute()` function
    // If the deadline has passed and the threshold is met, it should call `exampleExternalContract.complete{value: address(this).balance}()`

    function execute() external notCompleted {
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

    function withdraw() external notCompleted {
        require(openForWithDraw, "You cannot withdraw");

        uint userBalance = balances[msg.sender];

        require(userBalance != 0, "Your balance is 0, cannot withdraw");

        balances[msg.sender] = 0;

        payable(msg.sender).transfer(userBalance);
    }


    // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend

    function timeLeft() external view returns(uint) {
        if (block.timestamp < deadline) {
            return deadline - block.timestamp;
        }

        return 0;
    }


    // Add the `receive()` special function that receives eth and calls stake()

    receive() external payable {
        stake();
    }
}
