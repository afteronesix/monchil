// src/pages/GamePage.tsx
import GameCanvas from '../components/GameCanvas'; 

export default function GamePage() {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4 font-sans text-white">
      <h1 className="text-4xl font-bold mb-2">Mini Game </h1>
      <p className="text-gray-400 mb-4">For Fun Test</p>

      {/* Game Container */}
      <div className="relative w-full max-w-[360px] aspect-[360/510] shadow-2xl rounded-lg overflow-hidden border-4 border-gray-600">
        <GameCanvas />
      </div>

      {/* How to Play Section */}
      <div className="max-w-xl w-full mt-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How to Play</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>
            <strong>Go Left/Right:</strong> Use <kbd>&larr;</kbd> <kbd>&rarr;</kbd> keys or tap the left/right side of the screen.
          </li>
          <li>
            <strong>Start/Resume:</strong> Press <kbd>Space</kbd> or click the screen when the game is over.
          </li>
          <li>
            <strong>Life:</strong> Landing on normal floors recovers life. Hitting top spikes reduces life.
          </li>
          <li>
            <strong>Game Over:</strong> Falling off the bottom or running out of life.
          </li>
        </ul>
      </div>
    </div>
  );
}