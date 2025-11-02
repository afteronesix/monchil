// GamePage.tsx

import { useState } from 'react';
import { Play, ArrowLeftRight, Keyboard, Heart, ShieldAlert, Skull } from 'lucide-react';
import GameCanvas from '../components/GameCanvas';

export default function GamePage() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleGameOver = () => {
    setGameStarted(false);
  };

  const MainMenu = () => (
    <div className="w-full max-w-md flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-5xl font-bold mb-2">NS-SHAFT</h1>
      <p className="text-gray-400 mb-6">Test For Fun, wait for Update</p>
      
      <div className="bg-gray-900 border border-purple-700 rounded-lg p-5 w-full mb-8 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">How to Play</h2>
        <ul className="space-y-4 text-left text-gray-300">
          <li className="flex items-center gap-4">
            <ArrowLeftRight size={40} className="text-purple-400 flex-shrink-0" />
            <div>
              <strong>Move:</strong> Use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> keys or tap & hold the left/right side of the screen.
            </div>
          </li>
          <li className="flex items-center gap-4">
            <Keyboard size={40} className="text-purple-700 flex-shrink-0" />
            <div>
              <strong>Start Game:</strong> After clicking PLAY, press the <kbd>Space</kbd> key or click the screen again to begin.
            </div>
          </li>
          <li className="flex items-center gap-4">
            <Heart size={40} className="text-green-400 flex-shrink-0" />
            <div>
              <strong>Life:</strong> Landing on normal floors recovers life (❤️).
            </div>
          </li>
           <li className="flex items-center gap-4">
            <ShieldAlert size={40} className="text-yellow-400 flex-shrink-0" />
            <div>
              <strong>Danger:</strong> Hitting top spikes or spiked floors reduces life.
            </div>
          </li>
          <li className="flex items-center gap-4">
            <Skull size={40} className="text-red-500 flex-shrink-0" />
            <div>
              <strong>Game Over:</strong> Occurs when you fall off the screen or run out of life.
            </div>
          </li>
        </ul>
      </div>

      <button
        onClick={() => setGameStarted(true)}
        className="w-full max-w-xs bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg text-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
      >
        <Play size={24} />
        PLAY
      </button>
    </div>
  );

  const GameView = () => (
  <div className="relative w-full max-w-lg aspect-[480/680] shadow-2xl rounded-lg overflow-hidden border-4 border-purple-800">
    <GameCanvas onGameOver={handleGameOver} />
  </div>
);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-purple-700">
      {!gameStarted ? <MainMenu /> : <GameView />}
    </div>
  );
}