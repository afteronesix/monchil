// src/pages/GamePage.tsx
import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import GameCanvas from '../components/GameCanvas';

export default function GamePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="relative flex items-center justify-center mb-2">
        <h1 className="text-4xl font-bold">NS-SHAFT</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ml-4 text-gray-400 hover:text-white transition-colors"
          title="How to Play"
        >
          <HelpCircle size={28} />
        </button>
      </div>

      <p className="text-white mb-4">Test For Fun , wait for Update</p>

      {/* Game Container - Size Increased */}
      <div className="relative w-full max-w-lg aspect-[360/510] shadow-2xl rounded-lg overflow-hidden border-4 border-purple-800">
        <GameCanvas />
      </div>

      {/* "How to Play" Modal Component */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-gray-800 border border-purple-700 max-w-lg w-full p-6 rounded-2xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-purple-400">How to Play</h2>
            <ul className="list-disc list-inside space-y-3 text-gray-300">
              <li>
                <strong>Go Left/Right:</strong> Use the <kbd>&larr;</kbd> <kbd>&rarr;</kbd> keys or press & hold the left/right side of the screen on touch devices.
              </li>
              <li>
                <strong>Start/Resume:</strong> Press the <kbd>Space</kbd> key or click the screen when the game is over.
              </li>
              <li>
                <strong>Life:</strong> Landing on normal floors recovers life (❤️). Hitting top spikes or spiked floors reduces life.
              </li>
              <li>
                <strong>Game Over:</strong> Occurs when falling off the bottom or running out of life.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}