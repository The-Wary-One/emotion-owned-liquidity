import Head from "next/head";
import type { NextPage } from "next";
import { ContractData } from "~~/components/infused-token/ContractData";
import { ContractInteraction } from "~~/components/infused-token/ContractInteraction";

const InfusedToken: NextPage = () => {
  return (
    <>
      <Head>
        <title>Infused token</title>
        <meta name="description" content="Created with 🏗 scaffold-eth" />
        {/* We are importing the font this way to lighten the size of SE2. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree&display=swap" rel="stylesheet" />
      </Head>
      <div className="grid lg:grid-cols-2 flex-grow" data-theme="exampleUi">
        <ContractInteraction />
        <ContractData />
      </div>
    </>
  );
};

export default InfusedToken;
