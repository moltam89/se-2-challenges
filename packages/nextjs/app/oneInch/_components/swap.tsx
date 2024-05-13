"use client";

import { useEffect, useState } from "react";
import { tokens } from "./tokens";
import axios from "axios";
import { ethers } from "ethers";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";

type Token = {
  chainId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
};

export const Swap = () => {
  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [amount, setAmount] = useState<number>(0);
  const [swapBack, setSwapBack] = useState<boolean>(false);
  const [oneInchResponse1, setOneInchResponse1] = useState<OneInchResponse | null>(null);
  const [oneInchResponse2, setOneInchResponse2] = useState<OneInchResponse | null>(null);

  console.log("fromToken", fromToken);
  console.log("toToken", toToken);
  console.log("amount", amount);
  console.log("swapBack", swapBack);

  useEffect(() => {
    setOneInchResponse1(null);
    setOneInchResponse2(null);
  }, [fromToken, toToken, amount, swapBack]);

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
            className="input input-bordered w-1/3 text-center"
            onChange={e => {
              const token = tokens.find(
                token =>
                  token.symbol.toLowerCase() === e.target.value.toLowerCase() ||
                  token.address.toLocaleLowerCase() == e.target.value.toLocaleLowerCase(),
              ) as Token;
              setFromToken(token);
            }}
          />
          <input
            type="text"
            placeholder="e.g. USDC"
            className="input input-bordered w-1/3 text-center"
            onChange={e => {
              const token = tokens.find(
                token =>
                  token.symbol.toLowerCase() === e.target.value.toLowerCase() ||
                  token.address.toLocaleLowerCase() == e.target.value.toLocaleLowerCase(),
              ) as Token;
              setToToken(token);
            }}
          />
        </div>
        {(fromToken || toToken) && (
          <div className="flex justify-between">
            <div className="w-1/3">{fromToken && <TokenComponent token={fromToken} />}</div>
            <div className="w-1/3">{toToken && <TokenComponent token={toToken} />}</div>
          </div>
        )}

        <input
          type="text"
          placeholder="amount"
          className="input input-bordered w-1/3 text-center"
          onChange={e => {
            const parsedAmount = parseFloat(e.target.value);
            if (Number.isNaN(parsedAmount)) {
              setAmount(0);
            } else {
              setAmount(parsedAmount);
            }
          }}
        />
        <div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text"><ArrowPathRoundedSquareIcon className="h-8 w-8"/></span>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={swapBack}
                  onChange={e => setSwapBack(e.target.checked)}
                />
              </label>
            </div>
          </div>
        <button
          className="btn btn-primary uppercase"
          disabled={
            !fromToken || !toToken || amount === 0 || fromToken.address === toToken.address || oneInchResponse1 !== null
          }
          onClick={async () => {
            if (!fromToken || !toToken || amount === 0 || fromToken.address === toToken.address) {
              return;
            }
            const response1 = await getOneInchSwapCalldata(
              fromToken.address,
              toToken.address,
              ethers.parseUnits(amount.toString(), fromToken.decimals),
              "0x1D47202c87939f3263A5469C9679169F6E2b7F57",
            );
            setOneInchResponse1(response1);

            if (swapBack) {
              await new Promise(r => setTimeout(r, 1420));

              const response2 = await getOneInchSwapCalldata(
                toToken.address,
                fromToken.address,
                BigInt(response1.toAmount),
                "0x1D47202c87939f3263A5469C9679169F6E2b7F57",
              );
              setOneInchResponse2(response2);
            }
          }}
        >
          {swapBack ? "Swap Back" : "Swap"}
        </button>
        {oneInchResponse1?.toAmount && (
          <div>
            <strong>{ethers.formatUnits(oneInchResponse1?.toAmount, toToken?.decimals)}</strong>
          </div>
        )}
        {oneInchResponse1 && (!oneInchResponse2) && swapBack && <span className="loading loading-spinner loading-lg"></span>}
        {oneInchResponse2?.toAmount && (
          <div>
            <strong>{ethers.formatUnits(oneInchResponse2?.toAmount, fromToken?.decimals)}</strong>
          </div>
        )}
        {oneInchResponse1 && <OneInchResponseComponent response={oneInchResponse1} />}
        {oneInchResponse2 && <OneInchResponseComponent response={oneInchResponse2} />}
      </div>
    </div>
  );
};

export const TokenComponent = ({ token }: { token: Token }) => {
  return (
    <a href={"https://etherscan.io/token/" + token.address} target="_blank" rel="noopener noreferrer">
      <div className="flex items-center">
        <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 mr-2" />

        <div>
          <div className="font-bold">{token.symbol}</div>
        </div>
      </div>
    </a>
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
