import { useState, useEffect, useCallback } from 'react';
import { Nebula } from 'thirdweb/ai';
import { client } from './thirdwebClient';
import { useActiveAccount } from 'thirdweb/react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type TransactionDisplayData = {
  to: string;
  value?: string;
  data?: string;
  functionName?: string;
  args?: any[];
  chainId?: string;
};

// Custom hook for managing a chat session with Nebula AI
export function useNebulaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [transactionDisplayData, setTransactionDisplayData] = useState<TransactionDisplayData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
    setPendingTransactions([]);
    setTransactionDisplayData([]);
    setError(null);
  }, []);

  // Send a message to Nebula
  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Modify the message to include wallet address if connected
      let modifiedContent = content;
      if (address) {
        modifiedContent = `${content}\nMy connected wallet address is: ${address}`;
      }
      
      // Call Nebula AI with wallet context
      const response = await Nebula.chat({
        client,
        messages: [...messages, { role: 'user', content: modifiedContent }]
      });

      // Check for transactions in response
      if (response.transactions && response.transactions.length > 0) {
        // Store raw transaction data
        setPendingTransactions(response.transactions);
        
        // Format transactions for display
        const displayData = response.transactions.map((tx: any) => ({
          to: tx.to,
          value: tx.value ? tx.value.toString() : undefined,
          data: tx.data,
          functionName: tx.functionName || 'Transfer',
          args: tx.args || [],
          chainId: tx.chainId
        }));
        
        setTransactionDisplayData(displayData);
      } else {
        // Clear any previous transactions
        setPendingTransactions([]);
        setTransactionDisplayData([]);
      }

      // Add assistant's response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message || JSON.stringify(response)
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error in Nebula chat:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messages, address]);

  // Clear transactions after they're processed
  const clearTransactions = useCallback(() => {
    setPendingTransactions([]);
    setTransactionDisplayData([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    pendingTransactions: pendingTransactions,
    transactionDisplayData,
    clearTransactions,
    hasWallet: !!address,
    walletAddress: address
  };
}



