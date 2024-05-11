import { ethers } from "ethers";
import fs from "fs";

type Token = {
  symbol: string;
  address: string;
  decimals: number;
  img: string;
  network: number;
};

export default class TokenHelper {
  chainId: number;
  tokens: Token[];

  constructor(chainId: number) {
    this.chainId = chainId;
    this.tokens = [];
  }

  async init() {
    try {
      const data = await fs.promises.readFile("tokens.json", "utf-8");
      this.tokens = JSON.parse(data).tokens;
    } catch (error) {
      throw error;
    }
  }

  getToken(symbol: string): Token {
    const token = this.tokens.find(token => token.symbol === symbol);
    if (!token) {
      throw new Error(`Token with symbol ${symbol} not found.`);
    }
    return token;
  }

  getDecimalCorrectedAmount = (symbol: string, amount: number) => {
    return ethers.parseUnits(amount.toString(), this.getToken(symbol).decimals);
  };
}
