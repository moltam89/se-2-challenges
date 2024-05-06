//
// This script executes when you run 'yarn test'
//

import { ethers } from "hardhat";
import { DODOFlashloanArb } from "../typechain-types/contracts/DODOFlashloanArb";
import { expect } from "chai";


describe("🚩 Challenge N: Description", function () {
  // Change to name and type of your contract
  let dodoFlashloanArb: DODOFlashloanArb;

  describe("Deployment", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Don't change contractArtifact creation
    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder.
      contractArtifact = `contracts/download-${contractAddress}.sol:DODOFlashloanArb`;
    } else {
      contractArtifact = "contracts/DODOFlashloanArb.sol:DODOFlashloanArb";
    }

    it("Should deploy the contract", async function () {
      // Get the current block number
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("Current block number:", blockNumber);

      //const [owner] = await ethers.getSigners();
      const dodoFlashloanArbFactory = await ethers.getContractFactory(contractArtifact);
      dodoFlashloanArb = (await dodoFlashloanArbFactory.deploy()) as DODOFlashloanArb;
      //console.log("\t", " 🛰  Contract deployed on", await yourContract.getAddress());
    });
  });

  // Test group example
  describe("Initialization and change of greeting", function () {
    it("Should have the right message on deploy", async function () {
      //expect(await yourContract.greeting()).to.equal("Building Unstoppable Apps!!!");
    });

    it("Should allow setting a new message", async function () {
      //const newGreeting = "Learn Scaffold-ETH 2! :)";

      //await yourContract.setGreeting(newGreeting);
      //expect(await yourContract.greeting()).to.equal(newGreeting);
    });
  });
});
