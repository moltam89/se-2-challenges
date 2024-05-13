

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
Finding arbitrage opportunities and executing them are not easy. Usually swapping large amount of USDT/USDT (or any tokens) result in a small deficit. Even if there is an opportunity, arbitrage bots are continuously monitoring the network, trying to be the fastest to make profit. A possible way to not lose money on failed transactions is to use https://docs.flashbots.net/. 

## Draft text for the challenge

Welcome to the Flash Loan Arbitrage Challenge! This challenge aims to demystify flash loan arbitrage while providing a hands-on experience based on a real-life scenario. We'll guide you through replicating this on-chain transaction that resulted in 21 USDT magically appearing in a contract.

[Arbitrage](https://en.wikipedia.org/wiki/Arbitrage)  is the practice of taking advantage of a difference in prices in two or more markets (DEXes in our case).  An arbitrage opportunity is present when there is the possibility to instantaneously buy something for a low price and sell it for a higher price.

Flash loan arbitrage is a unique form of arbitrage. Instead of using our own funds, we borrow tokens from a flash loan provider contract. By trading the borrowed amount strategically to generate a larger sum, we can repay the loan and pocket the profit.

There is no free lunch though, we have to pay up front for deploying our arbitrage contract. Also we need to cover for the transaction fees, but we can establish rules within the contract to ensure that the remaining profit is sufficient.

It is unlikely that anyone will share publicly a profitable arbitrage bot, as it it a highly competitive area. This challenge is not an exception either, it is more like a proof of concept, that is is possible to land these kind of flash loan transactions onchain. You'll need to come up with your own idea to beat the already existing bots put there.

It is unlikely that anyone will share publicly a profitable arbitrage bot, as it is a highly competitive area. This challenge is not an exception either; it is more like a proof of concept that it is possible to land these kinds of flash loan transactions on chain. You'll need to come up with your own idea to beat the already existing bots out there.

There are 3 main pieces we will need 

1.  Find an arbitrage opportunity - a difference in prices in two or more markets
2.  Flash loan provider contract - an already deployed contract with enough liquidity to borrow from
3.  Arbitrage contract - our own orchestrating contract to borrow, make a profit, and repay the loan

**Find an arbitrage opportunity**
To identify arbitrage opportunities, we'll need to query the network for prices. One approach could involve querying both Uniswap V2 and V3 pools. However, this strategy has its limitations as it restricts us to Uniswap alone. Furthermore, studying both V2 and V3 could require significant effort. Additionally, expanding our search to other liquidity providers would necessitate learning how those protocols operate.

An easier approach is to utilize a DEX aggregator like [1inch](https://1inch.io/). 1inch searches across various liquidity providers, trying to ensure the best prices. Moreover, 1inch offers a developer [API](https://1inch.io/page-api/), hat allows us to make queries efficiently.
Go to the 1inch page and try to swap some tokens. 
<img width="1512" alt="Screenshot 2024-05-13 at 15 58 52" src="https://github.com/moltam89/se-2-challenges/assets/1397179/f457c6bd-7e3d-4d89-9d58-0de89b05df4f">

Here, swapping **1,000,000 USDC** would yield **1,000,283 USDT**. The API response also includes the 1inch aggregator contract address and the calldata. With 1 million USDC in our contract, executing the provided calldata on the 1inch contract would facilitate the swap (we'd also need to approve 1inch to spend our token).

**Our arbitrage strategy will involve swapping between tokens back and forth.**

<img width="1511" alt="Screenshot 2024-05-13 at 16 14 54" src="https://github.com/moltam89/se-2-challenges/assets/1397179/23ecbf6f-bd3e-42b1-ad1b-f63528b6f7e3">

Swapping the USDT back to USDC immediately would not be profitable at the moment, meaning we wouldn't be able to repay our flash loan.
