import { NavLink } from "react-router-dom";
import { BookOpen, Gamepad2, Sprout, PiggyBank } from "lucide-react";
import { ConnectWallet } from "./ConnectWallet";

export function SideMenu() {
  const commonClass = "flex items-center justify-center p-3 rounded-lg transition-colors";
  const activeClass = "bg-purple-700 text-white";
  const inactiveClass = "text-slate-400 hover:bg-purple-800 hover:text-white";

  return (
    <aside className="w-20 bg-purple-900 p-3 flex flex-col items-center justify-between">
      <div className="flex flex-col items-center gap-4">
        <a href="/" className="text-pink-400">
          <Sprout size={32} />
        </a>
        <nav className="flex flex-col gap-4">
          <NavLink
            to="/mint"
            className={({ isActive }) => `${commonClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <BookOpen size={24} />
          </NavLink>
          <NavLink
            to="/stake"
            className={({ isActive }) => `${commonClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <PiggyBank size={24} />
          </NavLink>
          <NavLink
            to="/game"
            className={({ isActive }) => `${commonClass} ${isActive ? activeClass : inactiveClass}`}
          >
            <Gamepad2 size={24} />
          </NavLink>
        </nav>
      </div>
      <div className="w-full">
        <ConnectWallet />
      </div>
    </aside>
  );
}