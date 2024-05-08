
# 🚩 Challenge Arbitrage (Draft)

## Quickstart
1. yarn install
2. yarn chain
3. yarn test

## Flashloan arbitrage with DODO and 1inch
Mimicking arbitrage transaction: https://etherscan.io/tx/0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34
EigenPhi:
https://eigenphi.io/mev/eigentx/multi/0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34
Tenderly:
https://dashboard.tenderly.co/tx/mainnet/0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34

This transaction borrowed 400.000 USDT from DODO, swapped it to USDC with 1inch, then swapped back to 400.021 USDT, paying 12USDT in transaction fees.

### DODOFlashloanArb.sol
**function  dodoFlashLoan**
1. Execute DODO's **flashLoan** function
2. Call **1Inch** with swap1 calldata
3. Call **1Inch** with swap2 calldata 
4. Transfer the loan back to DODO

### ChallengeN.ts
Script for mimicking the transaction (hardhat points to the original tx's block number)

1. Deploy DODOFlashloanArb
2. Test the block number
3. Test DODO Pool's USDT balance
4. Test allowance for 1Inch so it can swap the tokens
5. Test for querying 1inch for USDT -> USDC swap
6. Test if arbitrage results in 21 USDT left in the contract

#### DODO
[DODO flash loans](https://docs.dodoex.io/en/developer/contracts/dodo-v1-v2/guides/flash-loan)  have no fees which makes it ideal for arbitrage.
This [USDT/DAI pool](https://etherscan.io/address/0x3058ef90929cb8180174d74c507176cca6835d73) has more than 1.000.000 USDT/DAI we can borrow.

#### 1inch
[1inch API](https://docs.1inch.io/docs/aggregation-protocol/api/swagger/) can be used to query token swaps, the response contains the calldata which can be sent to the 1inch aggregator contract

#### Visualisation from EigenPhi

 - **Step 0** borrow from DODO pool : +400.000 USDT
 - **Step 1-6** execute 1inch swap1: -400.000 USDT, + 399.867 USDC
  - **Step 7-14** execute 1inch swap2: -399867 USDC, + 400.021 USDT
  - **Step 15** pay back the loan: -400.000 USDT
![eigentx-0x60de3cd915a47882dff0d918694d4dcad133807e223e34d5c442b3a89f3e7a34](https://github.com/moltam89/se-2-challenges/assets/1397179/52e76058-1a92-485f-881c-e99d1f1cab68)

#### Notes:
Finding arbitrage opportunities and executing them are not easy. Usually swapping large amount of USDT/USDT (or any tokens) result in a small deficit. Even if there is an opportunity, arbitrage bots are continuously monitoring the network, trying to be the fastest to make profit. A possible way to not loose money on failed transactions is to use https://docs.flashbots.net/. 
