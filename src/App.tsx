import { useEffect, useState, type ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, Store, Gamepad2, Gift } from 'lucide-react';
import Account from "./hooks/account";
import { MintNFT } from "./pages/MintNFT";
import GamePage from "./pages/GamePage";
import { MyFaucet } from "./pages/MyFaucet";

const shortenAddress = (address: string | undefined) => {
  if (!address) return null;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

type MenuItem = {
  name: string;
  icon: ReactNode;
  component: ReactNode;
};

export default function App() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('Mint');

  useEffect(() => {
    try {
      sdk.actions.ready();
      sdk.actions.addMiniApp();
    } catch (e) {
      console.warn("Farcaster SDK not available. This is expected in a normal browser.");
    }
  }, []);

  const menuItems: MenuItem[] = [
    { name: "Mint", icon: <Store className="w-5 h-5" />, component: <MintNFT /> },
    { name: "Faucet", icon: <Gift className="w-5 h-5" />, component: <MyFaucet /> },
    { name: "Game", icon: <Gamepad2 className="w-5 h-5" />, component: <GamePage /> },
  ];

  const ActiveComponent = menuItems.find(item => item.name === activePage)?.component || <MintNFT />;

  if (!isConnected) {
  return (
    <div className="min-h-screen bg-gray-950 flex justify-center items-center p-4">
      <div className="bg-gray-900 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-xl text-center max-w-md w-full border-2 border-gray-800">
        <h1 className="text-4xl font-black mb-4 text-purple-400">Welcome to Monchil</h1>
        <p className="mb-8 text-gray-300">Connect your wallet first!</p>

        <div className="flex flex-col gap-2">
          {connectors
            .filter(
              (c) =>
                c.name.toLowerCase().includes("meta") ||
                c.name.toLowerCase().includes("walletconnect") ||
                c.name.toLowerCase().includes("farcaster")
            )
            .map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="w-full bg-gray-800 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect with {connector.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}


  return (
    <div className={`relative ${activePage === 'Game' ? 'h-screen overflow-hidden' : 'min-h-screen bg-purple-700'}`}>
      <header className="absolute top-0 left-0 right-0 p-4 grid grid-cols-2 items-center z-50">
        <div className="justify-self-start">
          <Account />
        </div>
        <div className="relative justify-self-end">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center justify-center h-10 px-4 bg-gray-300/50 backdrop-blur-sm rounded-full shadow-md hover:bg-gray-500 transition-colors font-mono text-sm"
          >
            {shortenAddress(address)}
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-300 border border-gray-700 rounded-2xl shadow-lg z-10 overflow-hidden">
              <button onClick={() => { disconnect(); setMenuOpen(false); }} className="block w-full px-4 py-3 text-left font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`w-full ${activePage === 'Game' ? 'h-full' : 'px-4 pb-24 pt-24'}`}>
        {ActiveComponent}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-lg p-2 border-t border-purple-800 z-50">
        <div className="flex justify-around items-center">
            {menuItems.map(item => (
                <button 
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${activePage === item.name ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                    {item.icon}
                    <span className="text-xs font-bold">{item.name}</span>
                </button>
            ))}
        </div>
      </nav>
    </div>
  );
}
