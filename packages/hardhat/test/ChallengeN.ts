//
// This script executes when you run 'yarn test'
//

// Script to mimic flashloan arbitrage using DODO and 1inch
// https://etherscan.io/tx/0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34
// https://eigenphi.io/mev/eigentx/multi/0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34

// Borrow 400.000 USDT from DODO
// Swap USDT for 399.867 USDC using 1inch
// Swap USDC for 400.021 USDT using 1inch
// Tx cost 0.00758535552 * $1,593.01 / ETH = $12.07

import { ethers } from "hardhat";

import { DODOFlashloanArb } from "../typechain-types/DODOFlashloanArb.sol/DODOFlashloanArb";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import axios from "axios";

const addressUSDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const addressUSDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// DODO USDT/DAI Pool, we will use this pool to perform the flashloan, borrowing 400.000 USDT, DODO has no fees for flashloans
const addressDODOPool = "0x3058EF90929cb8180174D74C507176ccA6835D73";

// 1inch Aggregator, we can send calldata directly to the 1inch contract to perform the swap
// https://docs.1inch.io/docs/aggregation-protocol/api/swagger
const addressOneInchAggregator = "0x1111111254EEB25477B68fb85Ed929f73A960582";

const flashLoanAmountUSDT = 400000000000n; // 400.000 USDT

describe("🚩 Challenge Arbitrage", function () {
  describe("Executing flahsloan aritrage, mimicking https://etherscan.io/address/0xa951c184cf0c0f957468a9ab8ec3f76bc75262eb ", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Don't change contractArtifact creation
    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder.
      contractArtifact = `contracts/download-${contractAddress}.sol:DODOFlashloanArb`;
    } else {
      contractArtifact = "contracts/DODOFlashloanArb.sol:DODOFlashloanArb";
    }

    async function deployDODOFlashloanArbFixture() {
      const dodoFlashloanArbFactory = await ethers.getContractFactory(contractArtifact);
      const dodoFlashloanArb = (await dodoFlashloanArbFactory.deploy()) as DODOFlashloanArb;
      const addressDODOFlashloanArb = await dodoFlashloanArb.getAddress();

      return { dodoFlashloanArb, addressDODOFlashloanArb };
    }

    it("We are back in time around block number 18119016 where this arbitrage opportunity happened", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("Current block number:", blockNumber);
    });

    it("DODO pool has more than 400.000", async function () {
      const usdtContract = await ethers.getContractAt("IERC20", addressUSDT);
      const balanceUSDTDODO = await usdtContract.balanceOf(addressDODOPool);
      console.log("balance USDT DODO pool:", balanceUSDTDODO.toString());
      expect(balanceUSDTDODO).to.be.gt(flashLoanAmountUSDT);
    });

    it("1inch allowance is greater than the flashloanAmount (set to MaxUint256)", async function () {
      const { dodoFlashloanArb, addressDODOFlashloanArb } = await loadFixture(deployDODOFlashloanArbFixture);

      await approveOneInchToSpendToken(dodoFlashloanArb, addressUSDT);
      await approveOneInchToSpendToken(dodoFlashloanArb, addressUSDC);

      const usdtContract = await ethers.getContractAt("IERC20", addressUSDT);
      const usdcContract = await ethers.getContractAt("IERC20", addressUSDC);

      const allowanceUSDTOneInch = await usdtContract.allowance(addressDODOFlashloanArb, addressOneInchAggregator);
      const allowanceUSDCOneInch = await usdcContract.allowance(addressDODOFlashloanArb, addressOneInchAggregator);

      console.log("Allowance USDT OneInch:", allowanceUSDTOneInch);
      console.log("Allowance USDC OneInch:", allowanceUSDCOneInch);

      expect(allowanceUSDTOneInch).to.be.eq(ethers.MaxUint256);
      expect(allowanceUSDCOneInch).to.be.eq(ethers.MaxUint256);
    });

    it("We can query 1inch for swap calldata", async function () {
      const { addressDODOFlashloanArb } = await loadFixture(deployDODOFlashloanArbFixture);

      const oneInchResponse = await getOneInchSwapCalldata(
        addressUSDT,
        addressUSDC,
        flashLoanAmountUSDT,
        addressDODOFlashloanArb,
      );

      const toAmountUSDC = Number(ethers.formatUnits(oneInchResponse.toAmount, 6));
      expect(toAmountUSDC).to.be.gt(399500); // 399.500 USDC is the minimum amount we should get

      expect(oneInchResponse.tx.data).to.exist; // Check is swap calldata is returned
      console.log("1inch swap calldata for 400.000 USDT -> USDC swap:", oneInchResponse.tx.data);
    });

    it("Execute flashloan arbitrage", async function () {
      const { dodoFlashloanArb, addressDODOFlashloanArb } = await loadFixture(deployDODOFlashloanArbFixture);

      const usdtContract = await ethers.getContractAt("IERC20", addressUSDT);
      const usdcContract = await ethers.getContractAt("IERC20", addressUSDC);
      let balanceUSDT = await usdtContract.balanceOf(addressDODOFlashloanArb);
      let balanceUSDC = await usdcContract.balanceOf(addressDODOFlashloanArb);
      console.log("Balance USDT DODOFlashloanArb BEFORE arbitrage:", balanceUSDT.toString());
      console.log("Balance USDC DODOFlashloanArb BEFORE arbitrage:", balanceUSDC.toString());
      expect(balanceUSDT).to.be.eq(0);  // We start with 0 USDT/USDC
      expect(balanceUSDC).to.be.eq(0);

      await approveOneInchToSpendToken(dodoFlashloanArb, addressUSDT);
      await approveOneInchToSpendToken(dodoFlashloanArb, addressUSDC);

      await dodoFlashloanArb.dodoFlashLoan(
        addressDODOPool,
        flashLoanAmountUSDT,
        addressUSDT,
        false,
        addressOneInchAggregator,
        replaceCalldataAddress(calldataSwap1, addressOriginalDODOFlashloanArb, addressDODOFlashloanArb),
        addressOneInchAggregator,
        replaceCalldataAddress(calldataSwap2, addressOriginalDODOFlashloanArb, addressDODOFlashloanArb),
      );

      balanceUSDT = await usdtContract.balanceOf(addressDODOFlashloanArb);
      balanceUSDC = await usdcContract.balanceOf(addressDODOFlashloanArb);
      console.log("Balance USDT DODOFlashloanArb AFTER arbitrage:", balanceUSDT.toString());
      console.log("Balance USDC DODOFlashloanArb AFTER arbitrage:", balanceUSDC.toString());
      expect(balanceUSDT).to.be.gt(ethers.parseUnits("21", 6)); // We end with more than 21 USDT
      expect(balanceUSDC).to.be.gt(0); // We also end up with some USDC (0.1), because we send a little less for swap2 than what we get from swap1
    });
  });
});

async function approveOneInchToSpendToken(dodoFlashloanArb: DODOFlashloanArb, addressToken: string) {
  const tokenContract = await ethers.getContractAt("IERC20", addressToken);

  const approveCalldata = await tokenContract.approve.populateTransaction(addressOneInchAggregator, ethers.MaxUint256);
  //console.log("approveCalldata", approveCalldata);

  dodoFlashloanArb.anyThing(addressToken, 0, approveCalldata.data);
}

// Helper method to replace the address of the original contract with the address of our contract
function replaceCalldataAddress(calldata: string, addressOriginalReceiver: string, addressReceiver: string): string {
  const addressOriginalReceiverInCalldata = addressOriginalReceiver.slice(2).toLowerCase();
  const addressReceiverInCalldata = addressReceiver.slice(2).toLowerCase();

  return calldata.replace(addressOriginalReceiverInCalldata, addressReceiverInCalldata);
}
// These are the original transactions calldata for the swaps, contains the deployed contract address,
// we need to replace it with the address of our contract
const calldataSwap1 =
  "0x12aa3caf0000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000a951c184cf0c0f957468a9ab8ec3f76bc75262eb0000000000000000000000000000000000000000000000000000005d21dba0000000000000000000000000000000000000000000000000000000005d02190d97000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fc0000000000000000000000000000000000000000000000000000de0000b05120c9f93163c99695c6526b799ebca2207fdf7d61addac17f958d2ee523a2206206994597c13d831ec700048dae733300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005c2b97ac9a0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000080a06c4eca27a0b86991c6218b36c1d19d4a2e9eb0ce3606eb481111111254eeb25477b68fb85ed929f73a960582000000008b1ccac8";
const calldataSwap2 =
  "0x12aa3caf0000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000a951c184cf0c0f957468a9ab8ec3f76bc75262eb0000000000000000000000000000000000000000000000000000005d19ed03850000000000000000000000000000000000000000000000000000005d0b4f22f0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002d40000000000000000000000000000000000000000000002b600028800026e00a0c9e75c480000000000000000300200000000000000000000000000000000000000000000000000024000013051004a585e0f7c18e2c414221d6402652d5e0990e5f8a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800a4a5dcbcdf000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000d0b2f5018b5d22759724af6d4281ac0b132663600000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005120d17b3c9784510e33cd5b87b490e79253bcd81e2ea0b86991c6218b36c1d19d4a2e9eb0ce3606eb48004458d30ac9000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005884993bdd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000003208684f96458c540eb08f6f01b9e9afb2b7d4f0000000000000000000000000000000000000000000000000000000006506b67a0020d6bdbf78dac17f958d2ee523a2206206994597c13d831ec780a06c4eca27dac17f958d2ee523a2206206994597c13d831ec71111111254eeb25477b68fb85ed929f73a9605820000000000000000000000008b1ccac8";
const addressOriginalDODOFlashloanArb = "0xa951c184cf0c0f957468a9ab8ec3f76bc75262eb";

type OneInchTransaction = {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
};

type OneInchResponse = {
  toAmount: string;
  tx: OneInchTransaction;
};

async function getOneInchSwapCalldata(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: BigInt,
  fromAddress: string,
): Promise<OneInchResponse> {
  const API_URL = "https://api.1inch.dev/swap/v5.2/";
  const chainId = 1;
  const slippage = 0.001;
  const disableEstimate = true;

  const URL =
    API_URL +
    chainId +
    "/swap?" +
    "fromTokenAddress=" +
    fromTokenAddress +
    "&toTokenAddress=" +
    toTokenAddress +
    "&amount=" +
    amount +
    "&fromAddress=" +
    fromAddress +
    "&slippage=" +
    slippage +
    "&disableEstimate=" +
    disableEstimate;

  const oneInchApiKey = "6eM1F3F94is7N4aXHLJ3WMI4UErk7iqH"; // You can get your own at https://portal.1inch.dev/

  const response = await axios.get(URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + oneInchApiKey,
    },
  });

  return response.data;
}
