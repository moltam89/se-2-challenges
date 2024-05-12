"use client";

import { useState } from "react";
import { tokens } from "./tokens";
import axios from "axios";

type Token = {
    symbol: string;
    address: string;
    decimals: number;
    img: string;
    network: number;
  };

export const Swap = () => {
  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [oneInchResponse, setOneInchResponse] = useState<OneInchResponse | null>(null);

  console.log("fromToken", fromToken);
  console.log("toToken", toToken);

  return (
    <div className="flex items-center flex-col flex-grow w-full px-4 gap-12">
      <div
        className={
          "flex flex-col items-center space-y-8 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg mt-24 overflow-auto"
        }
      >
        <div className="flex justify-between">
          <input
            type="text"
            placeholder="e.g. USDT"
            className="input input-bordered w-1/3"
            onChange={e => {
            setFromToken(tokens.find(token => token.symbol.toLowerCase() === e.target.value.toLowerCase()));
            }}
          />
          <input
            type="text"
            placeholder="e.g. USDC"
            className="input input-bordered w-1/3"
            onChange={e => {
                setToToken(tokens.find(token => token.symbol.toLowerCase() === e.target.value.toLowerCase()));
              }}
          />
        </div>
        <input
          type="text"
          placeholder="amount"
          className="input input-bordered w-1/3"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button
          className="btn btn-primary uppercase"
          onClick={async () => {
            const response = await getOneInchSwapCalldata(
              "0xdac17f958d2ee523a2206206994597c13d831ec7",
              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              1000000000n,
              "0x1D47202c87939f3263A5469C9679169F6E2b7F57",
            );
            setOneInchResponse(response);
          }}
        >
          swap
        </button>
        {oneInchResponse && <OneInchResponseComponent response={oneInchResponse} />}
      </div>
    </div>
  );
};

export const OneInchResponseComponent = ({ response }: { response: OneInchResponse }) => {
  return (
    <div className={"flex flex-col items-center break-all"}>
      <div>
        <strong>To:</strong> {response.tx.to}
      </div>
      <div className={"pt-4"}>
        <strong>Calldata:</strong> {response.tx.data}
      </div>
    </div>
  );
};

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

  console.log("URL", URL);

  // https://corsproxy.io/ : A fast & simple way to fix CORS Errors
  const corsProxyURL = "https://corsproxy.io/?" + encodeURIComponent(URL);

  const response = await axios.get(corsProxyURL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + oneInchApiKey,
    },
  });

  console.log(response.data);

  return response.data;
}
