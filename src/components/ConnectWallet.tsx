"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/thirdwebClient";
import { defineChain } from "thirdweb/chains";

const ethereum = defineChain({
  id: 1,
  name: "Ethereum",
  rpc: "https://ethereum.rpc.thirdweb.com",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
});

export default function ConnectWallet() {
  return <ConnectButton client={client} chain={ethereum} />;
}



