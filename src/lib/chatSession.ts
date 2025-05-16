import { useState, useEffect, useCallback, useRef } from 'react';
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
  chainId?: any;
};

// Custom hook for managing a chat session with Nebula AI
export function useNebulaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [transactionDisplayData, setTransactionDisplayData] = useState<TransactionDisplayData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missingWalletWarning, setMissingWalletWarning] = useState(false);
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  
  // Use a ref to always have the latest address value
  const addressRef = useRef<string | undefined>(address);
  
  // Update the ref whenever address changes
  useEffect(() => {
    addressRef.current = address;
    // Clear missing wallet warning when wallet is connected
    if (address) {
      setMissingWalletWarning(false);
    }
  }, [address]);

  // Initialize with a system message that provides context for Nebula
  useEffect(() => {
    if (messages.length === 0) {
      // Add an initial system message that won't be shown to the user
      const systemContext: Message = {
        role: 'assistant',
        content: 'I am Nebula, an AI assistant that can help with blockchain transactions.'
      };
      setMessages([systemContext]);
    }
  }, []);

  // Effect to update pending transactions when wallet connects/disconnects
  useEffect(() => {
    // If we have pending transactions but no wallet, show warning
    if (pendingTransactions.length > 0 && !address) {
      setMissingWalletWarning(true);
    } else {
      setMissingWalletWarning(false);
    }
  }, [pendingTransactions.length, address]);

  // Clear chat history
  const clearChat = useCallback(() => {
    // Preserve the system message
    const systemMessage = messages.length > 0 ? [messages[0]] : [];
    setMessages(systemMessage);
    setPendingTransactions([]);
    setTransactionDisplayData([]);
    setError(null);
    setMissingWalletWarning(false);
  }, [messages]);

  // Send a message to Nebula
  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Always get the most up-to-date address from the ref
      const currentWalletAddress = addressRef.current;
      
      // Add user message to chat history (what user sees)
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Create message for Nebula with wallet context
      let modifiedContent = content;
      
      // Always append wallet address if available, with clear formatting
      if (currentWalletAddress) {
        modifiedContent = `${content}\n\nMy connected wallet address is: ${currentWalletAddress}\nPlease use this wallet for any transactions.`;
        console.log('Sending to Nebula with wallet address:', currentWalletAddress);
      } else {
        console.log('Warning: No wallet address available for Nebula');
        // Still proceed, but Nebula will know there's no wallet
      }
      
      // Build complete message history including system context
      const messageHistory = [...messages];
      
      // Replace the last message (the user's input) with the modified content
      const messagesForNebula = [
        ...messageHistory.slice(0, -1), 
        { 
          role: 'user' as const, 
          content: modifiedContent 
        }
      ];
      
      console.log('Sending full message history to Nebula:', messagesForNebula);
      
      // Call Nebula AI with complete context
      const response = await Nebula.chat({
        client,
        messages: messagesForNebula
      });

      // Check for transactions in response
      if (response.transactions && response.transactions.length > 0) {
        console.log('Received transactions from Nebula:', response.transactions);
        
        // Check if we have a wallet connected
        if (!currentWalletAddress) {
          console.warn('Transactions received but no wallet connected');
          setMissingWalletWarning(true);
        }
        
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
  }, [messages]);

  // Send an update to Nebula with current wallet address (useful after wallet connects)
  const refreshWalletContext = useCallback(async () => {
    if (!address || messages.length <= 1) return; // Only system message or no wallet
    
    try {
      setIsLoading(true);
      
      // We'll add a silent message only to Nebula's context, not visible to user
      const walletUpdateMessage = { 
        role: 'user' as const, 
        content: `My wallet is now connected. Address: ${address}. Please use this for any transactions.` 
      };
      
      // Don't add this message to the visible chat
      // Instead, just use it for the API call
      
      const response = await Nebula.chat({
        client,
        messages: [...messages, walletUpdateMessage]
      });
      
      // Only add Nebula's response if it contains meaningful content
      // or transactions, otherwise stay silent
      if (
        (response.message && response.message.trim() !== 'I can now prepare transactions for your connected wallet.') || 
        (response.transactions && response.transactions.length > 0)
      ) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.message || 'I can now prepare transactions for your connected wallet.'
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Check if we now have transactions
      if (response.transactions && response.transactions.length > 0) {
        setPendingTransactions(response.transactions);
        
        const displayData = response.transactions.map((tx: any) => ({
          to: tx.to,
          value: tx.value ? tx.value.toString() : undefined,
          data: tx.data,
          functionName: tx.functionName || 'Transfer',
          args: tx.args || [],
          chainId: tx.chainId
        }));
        
        setTransactionDisplayData(displayData);
      }
    } catch (err) {
      console.error('Error refreshing wallet context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, messages]);

  // Clear transactions after they're processed
  const clearTransactions = useCallback(() => {
    setPendingTransactions([]);
    setTransactionDisplayData([]);
    setMissingWalletWarning(false);
  }, []);

  return {
    messages: messages.slice(1), // Remove system message from what user sees
    isLoading,
    error,
    sendMessage,
    clearChat,
    refreshWalletContext,
    pendingTransactions,
    transactionDisplayData,
    clearTransactions,
    hasWallet: !!address,
    walletAddress: address,
    missingWalletWarning
  };
}



