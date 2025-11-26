import { useEffect, useState, type ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Store, Gamepad2, PiggyBank } from "lucide-react";
import Account from "./hooks/account";
import { MintNFT } from "./pages/MintNFT";
import GamePage from "./pages/GamePage";
import { StakePage } from "./pages/StakePage";

type MenuItem = {
  name: string;
  icon: ReactNode;
  component: ReactNode;
};

export default function App() {
  const [activePage, setActivePage] = useState("Mint");

  useEffect(() => {
    try {
      sdk.actions.ready();
      sdk.actions.addMiniApp();
    } catch {
      console.warn("Farcaster SDK not available.");
    }
  }, []);

  const menuItems: MenuItem[] = [
    {
      name: "Mint",
      icon: <Store className="w-5 h-5" />,
      component: <MintNFT />,
    },
    {
      name: "Stake",
      icon: <PiggyBank className="w-5 h-5" />,
      component: <StakePage />,
    },
    {
      name: "Game",
      icon: <Gamepad2 className="w-5 h-5" />,
      component: <GamePage />,
    },
  ];

  const ActiveComponent = menuItems.find((item) => item.name === activePage)
    ?.component || <MintNFT />;

  return (
    <div
      className={`relative ${
        activePage === "Game"
          ? "h-screen overflow-hidden"
          : "min-h-screen bg-purple-700"
      }`}
    >
      <header className="absolute top-0 left-0 right-0 p-4 grid grid-cols-2 items-center z-50">
        <div className="justify-self-start">
          <Account />
        </div>
        <div className="justify-self-end">
          <appkit-button balance="hide" />
        </div>
      </header>

      <main
        className={`w-full ${
          activePage === "Game" ? "h-full" : "px-4 pb-24 pt-24"
        }`}
      >
        {ActiveComponent}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-lg p-2 border-t border-purple-800 z-50">
        <div className="flex justify-around items-center">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full ${
                activePage === item.name
                  ? "text-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
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
