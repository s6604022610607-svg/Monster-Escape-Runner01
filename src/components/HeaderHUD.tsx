import React from 'react';
import { Volume2, VolumeX, Pause, Play, Trophy, Flame, Coins, Shield, Magnet, Zap } from 'lucide-react';
import { ActivePowerUps, GameStats } from '../types';

interface HeaderHUDProps {
  stats: GameStats;
  powerUps: ActivePowerUps;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  stats,
  powerUps,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
}) => {
  return (
    <div id="game-header-hud" className="w-full bg-[#16213e] border-b-4 border-[#e94560] px-4 py-3 flex flex-col gap-2 z-10 shadow-lg">
      {/* Top bar with Score, High Score & Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Current Score / Distance */}
        <div id="hud-current-score" className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-[#e94560] uppercase font-bold tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#e94560] animate-pulse" />
            <span>Distance / คะแนน</span>
          </div>
          <span className="text-2xl sm:text-3xl font-mono font-black text-white leading-none tracking-tight">
            {stats.score.toString().padStart(6, '0')}
          </span>
        </div>

        {/* High Score in High Contrast Theme Pill */}
        <div id="hud-high-score" className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-xs text-gray-400 uppercase font-bold tracking-wider">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>High Score</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-[#0f3460] bg-[#f0f0f0] px-3 py-0.5 rounded-md shadow-inner border border-gray-300">
            {stats.highScore.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Action buttons (Mute & Pause) */}
        <div className="flex items-center gap-1.5 pl-1">
          <button
            id="btn-toggle-mute"
            onClick={onToggleMute}
            aria-label={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-2 rounded-xl bg-[#0f3460] hover:bg-[#1a3b68] border border-[#16213e] text-white transition-colors active:scale-95 shadow"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#e94560]" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            aria-label={isPaused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}
            className="p-2 rounded-xl bg-[#0f3460] hover:bg-[#1a3b68] border border-[#16213e] text-white transition-colors active:scale-95 shadow"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Sub metrics: Distance, Coins & Speed */}
      <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-[#0f3460]/60 rounded-xl border border-[#0f3460]">
        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
          <span className="text-[#e94560] font-bold">🏃</span>
          <span className="text-gray-400">วิ่ง:</span>
          <span className="font-bold font-mono text-white">{stats.distance} m</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-gray-400">เหรียญ:</span>
          <span className="font-bold font-mono text-yellow-300">+{stats.coins}</span>
        </div>

        <div className="flex items-center gap-1.5 text-rose-300 font-medium">
          <Zap className="w-3.5 h-3.5 text-[#e94560]" />
          <span className="text-gray-400">Speed:</span>
          <span className="font-bold font-mono text-[#ff5e78]">x{stats.speed}</span>
        </div>
      </div>

      {/* Active Power-up Badges */}
      {(powerUps.shieldActive || powerUps.magnetTimer > 0 || powerUps.multiplierTimer > 0) && (
        <div id="hud-powerups-bar" className="flex items-center gap-2 pt-0.5">
          {powerUps.shieldActive && (
            <div className="flex items-center gap-1 bg-[#0f3460] border border-[#4cc9f0] text-[#4cc9f0] text-xs px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
              <Shield className="w-3 h-3" />
              <span>SHIELD ACTIVE</span>
            </div>
          )}
          {powerUps.magnetTimer > 0 && (
            <div className="flex items-center gap-1 bg-[#0f3460] border border-[#e94560] text-[#ff5e78] text-xs px-2.5 py-0.5 rounded-full shadow-sm">
              <Magnet className="w-3 h-3" />
              <span>MAGNET {Math.ceil(powerUps.magnetTimer)}s</span>
            </div>
          )}
          {powerUps.multiplierTimer > 0 && (
            <div className="flex items-center gap-1 bg-[#0f3460] border border-amber-400 text-amber-300 text-xs px-2.5 py-0.5 rounded-full shadow-sm">
              <Zap className="w-3 h-3" />
              <span>2X SCORE ({Math.ceil(powerUps.multiplierTimer)}s)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
