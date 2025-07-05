import { Outlet } from "react-router-dom";
import { SideMenu } from "./SideMenu";

export function Layout() {
  return (
    <div className="flex h-screen bg-purple-800">
      <SideMenu />
      <main className="flex-1 p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}