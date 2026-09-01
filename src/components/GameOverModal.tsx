import React from 'react';
import { RotateCcw, Trophy, Skull, Coins, Flame } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  playerName: string;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  playerName,
  onRestart,
}) => {
  return (
    <div
      id="game-over-modal"
      className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 z-30 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-full max-w-sm bg-[#16213e] border-2 border-[#e94560] rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(233,69,96,0.45)] flex flex-col items-center text-center space-y-4">
        {/* Monster Caught Header Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-[#e94560]/20 border-2 border-[#e94560] rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Skull className="w-8 h-8 text-[#ff5e78]" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-xl">👾</span>
        </div>

        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-white italic tracking-tighter leading-none">
            GAME OVER!
          </h2>
          <p className="text-xs text-red-200 uppercase tracking-widest font-semibold mt-1">
            {playerName ? `${playerName} โดนจับแล้ว!` : 'สัตว์ประหลาดจับคุณได้แล้ว!'}
          </p>
        </div>

        {/* New High Score Banner */}
        {isNewHighScore && (
          <div className="w-full py-2 px-3 bg-[#e94560]/20 border border-[#e94560] rounded-xl flex items-center justify-center gap-2 text-amber-300 text-sm font-black animate-pulse">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🎉 ทำลายสถิติใหม่ (NEW HIGH SCORE!)</span>
          </div>
        )}

        {/* Score Breakdown Table */}
        <div className="w-full bg-[#0f3460]/40 rounded-2xl p-4 border border-[#0f3460] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
              <Flame className="w-4 h-4 text-[#e94560]" />
              <span>คะแนนทั้งหมด</span>
            </div>
            <span className="text-2xl sm:text-3xl font-mono font-black text-white">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="h-px bg-[#0f3460]" />

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>คะแนนสูงสุด (High Score)</span>
            <span className="font-mono font-bold text-amber-300">
              {stats.highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>ระยะทางที่วิ่งได้</span>
            <span className="font-mono font-bold text-white">
              {stats.distance} เมตร
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>เหรียญทองที่เก็บได้</span>
            </div>
            <span className="font-mono font-bold text-yellow-300">
              +{stats.coins * 50} ({stats.coins} เหรียญ)
            </span>
          </div>
        </div>

        {/* Restart Button (เล่นใหม่) */}
        <button
          id="btn-play-again"
          type="button"
          onClick={onRestart}
          className="w-full py-4 px-6 bg-white hover:bg-gray-100 active:bg-gray-200 text-red-950 font-black text-lg rounded-full shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 text-red-950 stroke-[3]" />
          <span className="tracking-wide">TRY AGAIN (เล่นอีกครั้ง)</span>
        </button>
      </div>
    </div>
  );
};
