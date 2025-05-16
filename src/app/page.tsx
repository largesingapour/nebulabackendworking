import ConnectWallet from "../components/ConnectWallet";
import SimpleNebulaTransactions from "../components/SimpleNebulaTransactions";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Nebula Blockchain Assistant</h1>
      
      <div className="mb-6">
        <ConnectWallet />
      </div>
      
      <SimpleNebulaTransactions />
    </main>
  );
}



