// src/components/Menu.tsx

import { useState } from "react";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

export default function Menu({ items }: { items: MenuItem[] }) {
  const [activeMenu, setActiveMenu] = useState(0);

  return (
    <div className="flex flex-col relative h-full">
      
      <div className="flex-1 overflow-y-auto pb-24">
        {items[activeMenu].component}
      </div>

      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/80 backdrop-blur-md flex justify-around items-center py-3 shadow-inner z-50 border-t border-purple-700/50">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveMenu(index)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 ease-in-out ${
              activeMenu === index 
              ? "bg-purple-600 text-white shadow-lg -translate-y-2" 
              : "text-gray-400 hover:text-white hover:bg-purple-700/20"
            }`}
            title={item.name}
          >
            
            <div className="mb-1">
              {item.icon}
            </div>
            
            <span className="text-xs font-bold">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}