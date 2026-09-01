import React from 'react';
import { Sparkles, Trash2, Trophy, Clock, User } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  onClear: () => void;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  entries,
  onClear,
}) => {
  return (
    <div
      id="game-leaderboard-card"
      className="w-full max-w-[480px] bg-[#16213e] border-2 border-[#0f3460] rounded-2xl p-4 shadow-xl space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#0f3460] pb-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
            ตารางสถิติผู้เล่น (Hall of Fame)
          </h3>
        </div>
        {entries.length > 0 && (
          <button
            id="btn-clear-leaderboard"
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer px-2 py-0.5 rounded bg-red-950/40 border border-red-900/50"
          >
            <Trash2 className="w-3 h-3" />
            <span>ล้างสถิติ</span>
          </button>
        )}
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-5 text-gray-400 text-xs flex flex-col items-center gap-1.5">
          <Sparkles className="w-6 h-6 text-gray-500 animate-pulse" />
          <p>ยังไม่มีบันทึกสถิติ</p>
          <p className="text-[11px] text-gray-500">กรอกชื่อด้านบนแล้วเริ่มวิ่งเพื่อบันทึกสถิติของคุณ!</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {entries.slice(0, 5).map((entry, idx) => {
            const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div
                key={`${entry.playerName}-${entry.date}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f3460]/40 border border-[#0f3460] text-xs hover:border-[#4cc9f0]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-sm w-6 text-center">{rankMedal}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white tracking-wide">
                        {entry.playerName || 'Anonymous Runner'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1a1a2e] text-cyan-300 font-mono">
                        {entry.skin.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 font-mono">
                      <span>🏃 {entry.distance}m</span>
                      <span>🪙 {entry.coins} coins</span>
                      <span className="text-gray-500">• {entry.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-sm text-amber-300">
                    {entry.score.toLocaleString()}
                  </span>
                  <div className="text-[9px] text-gray-400 uppercase font-mono">Score</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
