"use client";

import { useState } from "react";

export const Swap = () => {
    const [fromTokenSymbol, setFromTokenSymbol] = useState("");
    const [toTokenSymbol, setToTokenSymbol] = useState("");
    const [amount, setAmount] = useState("");

    return (
        <div className="flex items-center flex-col flex-grow w-full px-4 gap-12">
            <div
                className={
                    "flex flex-col items-center space-y-8 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg mt-24"
                }
            >
                <div className="flex justify-between">
                    <input
                        type="text"
                        placeholder="e.g. USDT"
                        className="input input-bordered w-1/3"
                        value={fromTokenSymbol}
                        onChange={(e) => setFromTokenSymbol(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="e.g. USDC"
                        className="input input-bordered w-1/3"
                        value={toTokenSymbol}
                        onChange={(e) => setToTokenSymbol(e.target.value)}
                    />
                </div>
                <input
                    type="text"
                    placeholder="amount"
                    className="input input-bordered w-1/3"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => stakeETH()}>
                    Swap
                </button>
            </div>
        </div>
    );
};
