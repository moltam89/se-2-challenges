import { Swap } from "./_components/swap";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const OneInch: NextPage = () => {
  return (
    <>
      <Swap />
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">1inch</h1>
        <p className="text-neutral">
          You can use the 1inch Swap API here.
          <br /> Check{" "}
          <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / app / oneInch / page.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
};

export default OneInch;
