"use client";

import { useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { Nebula } from 'thirdweb/ai';
import { client } from '../lib/thirdwebClient';

export default function SimpleNebulaTransactions() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [nebulaTx, setNebulaTx] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction hook
  const { 
    mutate: sendTransaction,
    isPending,
    isSuccess,
    error: txError
  } = useSendTransaction();

  // Handle sending a message to Nebula
  const handleSendToNebula = async () => {
    if (!input.trim() || !address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setNebulaTx(null);
      
      // Create prompt with address
      const prompt = `${input.trim()} from ${address}`;
      setMessage(`Sending: ${prompt}`);
      
      // Call Nebula with the wallet address in the prompt
      const response = await Nebula.chat({
        client,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Check for transaction in response
      if (response.transactions && response.transactions.length > 0) {
        // Store the first transaction
        setNebulaTx(response.transactions[0]);
        setMessage(`${response.message || 'Transaction prepared. Ready to sign.'}`);
      } else {
        setMessage(response.message || 'No transaction was returned.');
      }
    } catch (err) {
      console.error('Error calling Nebula:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signing and sending the transaction
  const handleSignTransaction = () => {
    if (!nebulaTx) return;
    
    try {
      // Send the transaction directly from Nebula response
      sendTransaction(nebulaTx);
    } catch (err) {
      console.error('Error sending transaction:', err);
      setError(err instanceof Error ? err.message : 'Error sending transaction');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Simple Nebula Transactions</h2>
      
      {!address ? (
        <div className="mb-4 p-3 bg-yellow-50 border rounded-md">
          <p>Please connect your wallet first</p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-50 border rounded-md">
          <p className="text-sm">Connected: {address}</p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="send 0.0001 ETH to vitalik.eth"
          className="w-full p-2 border rounded-md"
          disabled={isLoading || !address}
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSendToNebula}
          disabled={isLoading || !input.trim() || !address}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
        >
          {isLoading ? 'Processing...' : 'Prepare Transaction'}
        </button>

        {nebulaTx && (
          <button
            onClick={handleSignTransaction}
            disabled={isPending || !nebulaTx}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-300"
          >
            {isPending ? 'Signing...' : 'Sign & Send'}
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 p-3 bg-gray-50 border rounded-md">
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
      )}

      {(error || txError) && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error || (txError as Error)?.message}</p>
        </div>
      )}

      {isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          <p className="font-medium">Success!</p>
          <p className="text-sm">Transaction sent successfully</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Examples:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>send 0.0001 ETH to vitalik.eth</li>
          <li>transfer 5 USDC to 0x1234...</li>
        </ul>
      </div>
    </div>
  );
} 