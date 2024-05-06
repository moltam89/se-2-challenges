//
// This script executes when you run 'yarn test'
//

import { ethers } from "hardhat";
import { DODOFlashloanArb } from "../typechain-types/DODOFlashloanArb.sol/DODOFlashloanArb";
import { expect } from "chai";

const addressUSDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; 
const addressUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; 

const addressDODOPool = "0xc9f93163c99695c6526b799ebca2207fdf7d61ad";

describe("🚩 Challenge N: Description", function () {
  // Change to name and type of your contract
  let dodoFlashloanArb: DODOFlashloanArb;

  describe("DODOFlashloanArb", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Don't change contractArtifact creation
    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder.
      contractArtifact = `contracts/download-${contractAddress}.sol:DODOFlashloanArb`;
    } else {
      contractArtifact = "contracts/DODOFlashloanArb.sol:DODOFlashloanArb";
    }

    it("DODO pool has enough founds ", async function () {
      // Get the current block number
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("Current block number:", blockNumber);

      const usdtContract = await ethers.getContractAt("IERC20", addressUSDT);
      const balance = await usdtContract.balanceOf(addressDODOPool);

      console.log("USDT balance:", balance.toString());

      //const [owner] = await ethers.getSigners();
      const dodoFlashloanArbFactory = await ethers.getContractFactory(contractArtifact);
      dodoFlashloanArb = (await dodoFlashloanArbFactory.deploy()) as DODOFlashloanArb;
      //console.log("\t", " 🛰  Contract deployed on", await yourContract.getAddress());
    });
  });
});
