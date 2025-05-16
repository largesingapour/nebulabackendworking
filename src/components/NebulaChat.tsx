"use client";

import { useState, useEffect, useRef } from "react";
import { useNebulaChat } from "../lib/chatSession";
import ContractActions from "./ContractActions";
import { useActiveAccount } from "thirdweb/react";

export default function NebulaChat() {
  const [input, setInput] = useState("");
  const activeAccount = useActiveAccount();
  const walletRefreshedRef = useRef(false);
  
  const { 
    messages, 
    isLoading, 
    error,
    sendMessage, 
    refreshWalletContext,
    pendingTransactions,
    transactionDisplayData,
    clearTransactions,
    walletAddress,
    missingWalletWarning
  } = useNebulaChat();

  // When wallet connects, refresh wallet context with Nebula ONCE if we have existing conversation
  useEffect(() => {
    // Only refresh wallet context if:
    // 1. Wallet is connected
    // 2. We have messages in the chat
    // 3. We haven't refreshed before
    if (activeAccount?.address && messages.length > 0 && !walletRefreshedRef.current) {
      walletRefreshedRef.current = true; // Mark as refreshed
      refreshWalletContext();
    }
  }, [activeAccount?.address, refreshWalletContext]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    setInput("");
    
    // Check if this might be a transaction-related query
    const transactionKeywords = [
      'send', 'transfer', 'eth', 'token', 'transaction', 'pay', 'swap',
      'buy', 'purchase', 'trade', 'exchange', 'bridge', '0x', 'gas', 'fee'
    ];
    
    const mightBeTransactionQuery = transactionKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    );
    
    // For transaction-related queries, always refresh wallet context first
    if (mightBeTransactionQuery && activeAccount?.address) {
      console.log('Transaction-related query detected, refreshing wallet context');
      await refreshWalletContext();
      // Short delay to ensure context is updated
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await sendMessage(userInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {!activeAccount && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
          <p className="text-sm font-medium">Wallet not connected</p>
          <p className="text-xs">Connect your wallet to enable transaction capabilities.</p>
        </div>
      )}
      
      {activeAccount && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          <p className="text-sm font-medium">Wallet connected</p>
          <p className="text-xs truncate">Address: {walletAddress}</p>
        </div>
      )}

      {missingWalletWarning && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md text-orange-700">
          <p className="text-sm font-medium">Wallet Required for Transaction</p>
          <p className="text-xs">Nebula has prepared transaction(s) but needs your connected wallet. Please connect your wallet.</p>
        </div>
      )}

      <div className="mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <p>Start a conversation with the Nebula AI assistant.</p>
            <p className="text-sm">Ask about blockchain, smart contracts, or crypto wallets.</p>
            <p className="text-sm mt-2">Try: "Send 0.0001 ETH to vitalik.eth"</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-lg ${m.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
            >
              <div className="font-semibold mb-2">
                {m.role === 'user' ? 'You' : 'Nebula Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="p-4 rounded-lg bg-gray-50 animate-pulse">
            <div className="font-semibold mb-2">Nebula Assistant</div>
            <div>Thinking...</div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="font-semibold mb-2">Error</div>
            <div>{error}</div>
          </div>
        )}

        {pendingTransactions && pendingTransactions.length > 0 && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Transaction Ready</h3>
            <p className="mb-4">Nebula has prepared {pendingTransactions.length > 1 ? `${pendingTransactions.length} transactions` : 'a transaction'} for you to sign.</p>
            
            <ContractActions
              transactions={pendingTransactions}
              displayData={transactionDisplayData}
              onSuccess={(data) => {
                console.log('Transaction successful:', data);
                clearTransactions();
              }}
              onError={(error) => {
                console.error("Transaction error:", error);
              }}
              onComplete={clearTransactions}
            />
          </div>
        )}

        {messages.length > 0 && 
          messages[messages.length-1].role === 'assistant' && 
          messages[messages.length-1].content.includes('issue connecting to your wallet') && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={async () => {
                await refreshWalletContext();
                // Add a specific retry message
                await sendMessage('Retry the transaction with my connected wallet now. My wallet is definitely connected.');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Retry With Connected Wallet
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <textarea
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeAccount ? "Ask something or request a transaction..." : "Connect your wallet for full functionality..."}
          rows={3}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}



