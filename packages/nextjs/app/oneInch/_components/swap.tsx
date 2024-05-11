"use client";

export const Swap = () => {
  return (
    <div className="flex items-center flex-col flex-grow w-full px-4 gap-12">
      <div
        className={
          "flex flex-col items-center space-y-8 bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg mt-24"
        }
      >
        <div className="flex justify-between">
            <input type="text" placeholder="e.g. USDT" className="input input-bordered w-1/3 " />
            <input type="text" placeholder="e.g. USDC" className="input input-bordered w-1/3 " />
        </div>
        <input type="text" placeholder="amount" className="input input-bordered w-1/3 " />
        <button className="px-4 py-2 bg-primary text-white rounded-md">Get swap data</button>
      </div>
    </div>
  );
};
