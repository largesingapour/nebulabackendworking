import ConnectWallet from "../components/ConnectWallet";
import NebulaChat from "../components/NebulaChat";

export default function Home() {
  return (
    <main>
      <h1>Nebula Blockchain Assistant</h1>
      <ConnectWallet />
      <NebulaChat />
    </main>
  );
}



