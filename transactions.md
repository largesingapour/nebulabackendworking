Here’s a practical React/TypeScript example (thirdweb v5) showing how to take a prepared transaction from Nebula, let user review/confirm it, then sign and send it using the connected wallet.

Assumptions:
- You use `useActiveAccount` and `client` from thirdweb.
- The `Nebula.chat()` response includes `.transactions` (array of transaction objects).
- You already have wallet connection logic elsewhere.

---

### 1. Prepare & Store Transactions from Nebula

Call Nebula and receive `response.transactions`:

```ts
// Example structure to receive and store Nebula-prepared transactions
const nebulaResponse = await Nebula.chat({ client, messages: [...chatHistory, userMessage] });
setPendingTransactions(nebulaResponse.transactions); // array of prepared tx objects
setAssistantMessage(nebulaResponse.message);
```
---

### 2. Render the Transaction(s) for Review

For each tx object, show summary and provide a "Send" button:

```tsx
// Display pending tx and handle "Send" action:
{pendingTransactions?.map((tx, idx) => (
  <div key={idx} style={{ marginBottom: 16 }}>
    <div>To: {tx.to}</div>
    <div>Value: {tx.value ?? '0'} wei</div>
    <div>Data: {tx.data?.slice(0, 24)}...</div>
    <button onClick={() => handleSendTx(tx)}>Sign & Send</button>
  </div>
))}
```
---

### 3. Sign & Send with Thirdweb's `sendTransaction`

You need to use the connected wallet's `sendTransaction` method, available via thirdweb hooks:

```ts
import { useSendTransaction, useActiveAccount } from "thirdweb/react";

function handleSendTx(tx: any) {
  if (!account) throw new Error('No wallet connected');

  // tx should have fields: to, value, data, (and optionally gas, gasPrice, nonce)
  sendTransaction({
    to: tx.to,
    value: tx.value, // usually string, in wei ("0" for calls)
    data: tx.data,
    chainId: tx.chainId, // optional - usually current chain
  });
}

// Use thirdweb's hook in your component:
const account = useActiveAccount();
const { sendTransaction, isLoading, error, receipt } = useSendTransaction();
```
- After calling `sendTransaction`, listen for `receipt` and handle confirmations/UI as needed.

---

### 4. Full Minimal Example

Here's a consolidated example for a single transaction:

```tsx
import React from "react";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";

// tx: { to, value, data, chainId }
function TransactionExecutor({ tx }) {
  const account = useActiveAccount();
  const { sendTransaction, isLoading, error, receipt } = useSendTransaction();

  if (!tx) return null;

  return (
    <div>
      <div>To: {tx.to}</div>
      <div>Value: {tx.value ?? "0"}</div>
      <div>Data: {tx.data?.slice(0, 24)}...</div>
      <button
        disabled={!account || isLoading}
        onClick={() =>
          sendTransaction({
            to: tx.to,
            value: tx.value,
            data: tx.data,
            chainId: tx.chainId,
          })
        }
      >
        Send Transaction
      </button>
      {isLoading && <p>Sending...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}
      {receipt && <p>Tx confirmed: {receipt.transactionHash}</p>}
    </div>
  );
}
```
---

**How it works:**
- Nebula prepares unsigned tx objects.
- User reviews transaction details.
- User clicks "Send"—`useSendTransaction` signs and broadcasts with connected wallet.
- Show status/errors/confirmation.

You can adapt for multi-transaction flows or integrate confirmation dialogs as needed.

Would you like me to break down the transaction structure or explain how to handle contract calls vs. simple transfers?
