"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/thirdwebClient";
import { defineChain } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import { useState, useEffect } from "react";

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
  const activeAccount = useActiveAccount();
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    setIsConnected(!!activeAccount);
  }, [activeAccount]);

  return (
    <div className="flex flex-col items-center">
      <ConnectButton 
        client={client} 
        chain={ethereum} 
      />
      
      {activeAccount && (
        <div className="mt-2 text-sm text-green-600">
          <p>Connected: {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}</p>
        </div>
      )}
    </div>
  );
}



