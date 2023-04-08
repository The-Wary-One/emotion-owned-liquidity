import { useState } from "react";
import { CopyIcon } from "./assets/CopyIcon";
import { DiamondIcon } from "./assets/DiamondIcon";
import { HareIcon } from "./assets/HareIcon";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { ArrowSmallRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export const ContractInteraction = () => {
  const { address: userAddress } = useAccount();
  const { data: vault } = useDeployedContractInfo("Vault");

  const [visible, setVisible] = useState(true);
  const [tokenId, setTokenId] = useState<ethers.BigNumber | undefined>();

  const { data: balance } = useScaffoldContractRead({
    contractName: "InfusedToken",
    functionName: "balanceOf",
    args: [userAddress],
  });
  const { data: staked } = useScaffoldContractRead({
    contractName: "InfusedToken",
    functionName: "stakedAt",
    args: [balance],
    select: ethers.BigNumber.from,
  });

  const { writeAsync: mint, isLoading: mintLoading } = useScaffoldContractWrite({
    contractName: "InfusedToken",
    functionName: "mint",
    args: [tokenId],
  });
  const { writeAsync: stake, isLoading: stakeLoading } = useScaffoldContractWrite({
    contractName: "InfusedToken",
    functionName: "stake",
    args: [balance, vault?.address],
  });
  const { writeAsync: burn, isLoading: burnLoading } = useScaffoldContractWrite({
    contractName: "InfusedToken",
    functionName: "burn",
    args: [balance],
  });

  return (
    <div className="flex bg-base-300 relative pb-10">
      <DiamondIcon className="absolute top-24" />
      <CopyIcon className="absolute bottom-0 left-36" />
      <HareIcon className="absolute right-0 bottom-24" />
      <div className="flex flex-col w-full mx-5 sm:mx-8 2xl:mx-20">
        <div className={`mt-10 flex gap-2 ${visible ? "" : "invisible"} max-w-2xl`}>
          <div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
            <span className="text-3xl">👋🏻</span>
            <div>
              <div>
                In this page you can see how some of our <strong>hooks & components</strong> work, and how you can bring
                them to life with your own design! Have fun and try it out!
              </div>
              <div className="mt-2">
                Check out{" "}
                <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem]">
                  packages / nextjs/pages / example-ui.tsx
                </code>{" "}
                and its underlying components.
              </div>
            </div>
          </div>
          <button
            className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 drop-shadow-md"
            onClick={() => setVisible(false)}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col mt-6 px-7 py-8 bg-base-200 opacity-80 rounded-2xl shadow-lg border-2 border-primary">
          {!balance || balance.isZero() ? (
            <>
              <span className="text-4xl sm:text-6xl text-black">Mint</span>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                <input
                  type="text"
                  placeholder="Amount to infuse"
                  className="input font-bai-jamjuree w-full px-5 bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] border border-primary text-lg sm:text-2xl placeholder-white uppercase"
                  onChange={e => setTokenId(ethers.BigNumber.from(e.target.value))}
                />
                <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                  <div className="flex rounded-full border-2 border-primary p-1">
                    <button
                      className={`btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                        mintLoading ? "loading" : ""
                      }`}
                      onClick={mint}
                    >
                      {!mintLoading && (
                        <>
                          Mint <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 items-start">
                <span className="text-sm leading-tight">Price:</span>
                <div className="badge badge-warning">Gas</div>
              </div>
            </>
          ) : !staked || ethers.BigNumber.from(staked).isZero() ? (
            <>
              <span className="text-4xl sm:text-6xl text-black">Stake or Burn</span>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                  <div className="flex rounded-full border-2 border-primary p-1">
                    <button
                      className={`btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                        stakeLoading ? "loading" : ""
                      }`}
                      onClick={stake}
                    >
                      {!stakeLoading && (
                        <>
                          Stake <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                  <div className="flex rounded-full border-2 border-primary p-1">
                    <button
                      className={`btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                        burnLoading ? "loading" : ""
                      }`}
                      onClick={burn}
                    >
                      {!burnLoading && (
                        <>
                          Burn <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-4xl sm:text-6xl text-black">Burn</span>

              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
                <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
                  <div className="flex rounded-full border-2 border-primary p-1">
                    <button
                      className={`btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest ${
                        burnLoading ? "loading" : ""
                      }`}
                      onClick={burn}
                    >
                      {!burnLoading && (
                        <>
                          Burn <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
