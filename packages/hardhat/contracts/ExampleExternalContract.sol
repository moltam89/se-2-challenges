// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;  //Do not change the solidity version as it negativly impacts submission grading

import "@openzeppelin/contracts/access/Ownable.sol";

contract ExampleExternalContract is Ownable {

  bool public completed;

  constructor(address owner) {
    _transferOwnership(owner);
  }

  function complete() public payable {
    completed = true;
  }

  function transfer(address payable receiver) external onlyOwner {
    (bool success, ) = receiver.call{value: address(this).balance}("");
    require(success, "Failed to send ether");
  }

}
