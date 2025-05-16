"use client";

import { useState, useEffect } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { client } from '../lib/thirdwebClient';

// Display type for transaction UI
type TransactionDisplayData = {
  to: string;
  value?: string;
  data?: string;
  functionName?: string;
  args?: any[];
  chainId?: any;
};

type TransactionDisplayProps = {
  transactions: TransactionDisplayData[];
  onAccept: (tx: TransactionDisplayData) => void;
  onReject: () => void;
  isLoading: boolean;
};

function TransactionDisplay({ 
  transactions, 
  onAccept, 
  onReject, 
  isLoading 
}: TransactionDisplayProps) {
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-blue-50 border-b">
        <h3 className="text-lg font-bold">Transaction Details</h3>
      </div>
      
      <div className="p-4 space-y-3">
        {transactions.map((tx, index) => (
          <div key={index} className="p-3 bg-white rounded border">
            <div className="font-mono text-sm mb-1 truncate">
              <span className="font-semibold">To:</span> {tx.to}
            </div>
            {tx.functionName && (
              <div className="text-sm">
                <span className="font-semibold">Function:</span> {tx.functionName}
              </div>
            )}
            {tx.value && (
              <div className="text-sm">
                <span className="font-semibold">Value:</span> {tx.value} ETH
              </div>
            )}
            {tx.data && (
              <div className="text-sm">
                <span className="font-semibold">Data:</span> {tx.data.slice(0, 24)}...
              </div>
            )}
            {tx.args && tx.args.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold">Arguments:</span>
                <pre className="bg-gray-100 p-1 rounded mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(tx.args, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onAccept(tx)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Sign & Send'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
        <button
          onClick={onReject}
          className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-100"
          disabled={isLoading}
        >
          Cancel All
        </button>
      </div>
    </div>
  );
}

export default function ContractActions({ 
  transactions,
  displayData = [],
  onSuccess,
  onError,
  onComplete
}: { 
  transactions: any[]; // Array of transactions from Nebula
  displayData: TransactionDisplayData[]; // User-friendly display data
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(true); // Default to showing the confirm dialog
  const [currentTxIndex, setCurrentTxIndex] = useState<number | null>(null);
  const account = useActiveAccount();
  
  // Hook for transactions
  const { 
    mutate: sendTransaction, 
    isPending: isLoading,
    isSuccess,
    error,
    data: receipt
  } = useSendTransaction();

  // Handle transaction confirmation
  const handleAccept = (tx: TransactionDisplayData) => {
    if (!account) {
      if (onError) onError(new Error('No wallet connected'));
      return;
    }

    try {
      // Find the matching transaction in the transactions array
      const index = displayData.findIndex(item => item.to === tx.to);
      if (index >= 0) {
        setCurrentTxIndex(index);
        const rawTx = transactions[index];
        
        // Send the transaction through the wallet according to thirdweb v5 pattern
        sendTransaction({
          to: rawTx.to,
          value: rawTx.value,
          data: rawTx.data,
          chain: rawTx.chainId,
          client
        });
      }
    } catch (err) {
      console.error('Error sending transaction:', err);
      if (onError) onError(err as Error);
    }
  };

  // Handle transaction rejection
  const handleReject = () => {
    setShowConfirm(false);
    onComplete?.();
  };

  // Handle success
  useEffect(() => {
    if (isSuccess && receipt) {
      if (onSuccess) onSuccess({ receipt, index: currentTxIndex });
      if (showConfirm) setShowConfirm(false);
      onComplete?.();
    }
  }, [isSuccess, receipt, currentTxIndex, onSuccess, onComplete, showConfirm]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error as Error);
    }
  }, [error, onError]);

  if (!transactions || transactions.length === 0 || displayData.length === 0) {
    return null;
  }

  return (
    <div>
      {showConfirm ? (
        <TransactionDisplay
          transactions={displayData}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={isLoading}
        />
      ) : null}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <p className="font-semibold">Transaction failed</p>
          <p className="text-sm">{(error as Error).message}</p>
          <button 
            onClick={() => setShowConfirm(true)} 
            className="mt-2 px-3 py-1 bg-white border border-red-300 text-red-700 rounded-md text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {isSuccess && receipt && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
          <p className="font-semibold">Transaction successful!</p>
          <p className="text-sm">Transaction hash: <span className="font-mono">{receipt.transactionHash}</span></p>
        </div>
      )}
    </div>
  );
}



