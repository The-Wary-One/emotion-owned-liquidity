import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const ContractData = () => {
  const { address: userAddress } = useAccount();
  const [nft, setNFT] = useState(null);
  const { data: balance } = useScaffoldContractRead({
    contractName: "InfusedToken",
    functionName: "balanceOf",
    args: [userAddress],
  });
  const { data: tokenURI } = useScaffoldContractRead({
    contractName: "InfusedToken",
    functionName: "tokenURI",
    args: [balance],
  });
  useEffect(() => {
    if (tokenURI) {
      // @ts-ignore
      async function getSVG() {
        const response = await fetch(new URL(tokenURI as string));
        const json = await response.json();
        setNFT(json.image);
      }
      getSVG();
    }
  }, [tokenURI]);

  return (
    <div className="flex flex-col justify-center items-center bg-[url('/assets/gradient-bg.png')] bg-[length:100%_100%] py-10 px-5 sm:px-0 lg:py-auto max-w-[100vw] ">
      {balance && balance.gt(0) && nft && (
        <div className={`flex flex-col max-w-md bg-base-200 bg-opacity-70 rounded-2xl shadow-lg px-5 py-4 w-full`}>
          <Image src={nft} alt="nft" width={500} height={800} />
        </div>
      )}
    </div>
  );
};
