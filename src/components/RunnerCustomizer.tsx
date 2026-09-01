import React from 'react';
import { User, Palette, Zap, Check } from 'lucide-react';
import { CharacterSkin, DifficultyLevel } from '../types';

interface RunnerCustomizerProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  characterSkin: CharacterSkin;
  onSkinChange: (skin: CharacterSkin) => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (diff: DifficultyLevel) => void;
  isGamePlaying: boolean;
}

const SKINS: { id: CharacterSkin; name: string; icon: string; previewColor: string; desc: string }[] = [
  {
    id: 'CYBER_PUNK',
    name: 'Cyber Punk',
    icon: '⚡',
    previewColor: 'bg-cyan-500 border-cyan-400',
    desc: 'ชุดสูทนีออนสีฟ้า-ชมพูคลาสสิก',
  },
  {
    id: 'NEON_BLAZE',
    name: 'Neon Blaze',
    icon: '🔥',
    previewColor: 'bg-amber-500 border-red-500',
    desc: 'ชุดเพลิงส้มร้อนแรง เผาผลาญทุกเลน',
  },
  {
    id: 'STEALTH_SHADOW',
    name: 'Stealth Shadow',
    icon: '🥷',
    previewColor: 'bg-emerald-500 border-emerald-400',
    desc: 'ชุดพรางเงามรกต ดุดันเงียบเชียบ',
  },
  {
    id: 'GOLDEN_CHAMPION',
    name: 'Gold Champion',
    icon: '👑',
    previewColor: 'bg-yellow-400 border-amber-300',
    desc: 'ชุดแชมเปียนทองคำ เปล่งประกาย',
  },
];

const DIFFICULTIES: { id: DifficultyLevel; label: string; speed: string; color: string }[] = [
  { id: 'NORMAL', label: 'ปกติ (Normal)', speed: 'ความเร็วเริ่มต้น 1.0x', color: 'text-emerald-400' },
  { id: 'HARD', label: 'ยาก (Hard)', speed: 'ความเร็วเริ่มต้น 1.4x', color: 'text-amber-400' },
  { id: 'EXTREME', label: 'โหดสุด (Extreme)', speed: 'ความเร็วเริ่มต้น 1.8x', color: 'text-rose-400' },
];

export const RunnerCustomizer: React.FC<RunnerCustomizerProps> = ({
  playerName,
  onPlayerNameChange,
  characterSkin,
  onSkinChange,
  difficulty,
  onDifficultyChange,
  isGamePlaying,
}) => {
  return (
    <div
      id="runner-customizer-panel"
      className="w-full max-w-[480px] bg-[#16213e] border-2 border-[#0f3460] rounded-2xl p-4 shadow-xl space-y-3.5"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#0f3460] pb-2.5">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#4cc9f0]" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            ปรับแต่งนักวิ่ง &amp; ระดับความยาก (Customization)
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#0f3460] text-cyan-300 font-bold">
          Interactive
        </span>
      </div>

      {/* 1. Player Name Input (Text Input Interaction) */}
      <div className="space-y-1.5">
        <label
          htmlFor="input-player-name"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wide"
        >
          <User className="w-3.5 h-3.5 text-[#e94560]" />
          <span>ชื่อนักวิ่ง (Player Name):</span>
        </label>
        <div className="relative">
          <input
            id="input-player-name"
            type="text"
            maxLength={18}
            disabled={isGamePlaying}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="พิมพ์ชื่อของคุณ เช่น CYBER_RUNNER"
            className="w-full px-3.5 py-2 bg-[#0f3460]/70 border border-[#0f3460] focus:border-[#4cc9f0] focus:ring-1 focus:ring-[#4cc9f0] rounded-xl text-sm text-white placeholder:text-gray-500 font-medium transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="absolute right-3 top-2.5 text-[11px] font-mono text-gray-400">
            {playerName.length}/18
          </span>
        </div>
      </div>

      {/* 2. Character Skin Picker (Button / Selector Interaction) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-yellow-400" />
            <span>เลือกสกินชุดนักวิ่ง (Runner Skin):</span>
          </div>
          <span className="text-[#4cc9f0] font-mono text-[11px]">
            {SKINS.find((s) => s.id === characterSkin)?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKINS.map((skin) => {
            const isSelected = characterSkin === skin.id;
            return (
              <button
                key={skin.id}
                id={`btn-skin-${skin.id.toLowerCase()}`}
                type="button"
                onClick={() => onSkinChange(skin.id)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer text-left relative active:scale-95 ${
                  isSelected
                    ? 'bg-[#0f3460] border-[#4cc9f0] shadow-[0_0_12px_rgba(76,201,240,0.35)]'
                    : 'bg-[#1a1a2e]/80 border-[#0f3460]/70 hover:border-gray-500 text-gray-400'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#4cc9f0] rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-gray-900 stroke-[3]" />
                  </div>
                )}
                <div className="text-xl">{skin.icon}</div>
                <span className="text-[11px] font-bold text-white text-center leading-tight truncate w-full">
                  {skin.name}
                </span>
                <div className={`w-full h-1.5 rounded-full mt-0.5 border ${skin.previewColor}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Difficulty Level Selector (Buttons Interaction) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-gray-300 uppercase tracking-wide">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#e94560]" />
            <span>ระดับความยาก (Difficulty):</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((diff) => {
            const isSelected = difficulty === diff.id;
            return (
              <button
                key={diff.id}
                id={`btn-diff-${diff.id.toLowerCase()}`}
                type="button"
                disabled={isGamePlaying}
                onClick={() => onDifficultyChange(diff.id)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-[#e94560]/20 border-[#e94560] shadow-[0_0_10px_rgba(233,69,96,0.3)] text-white'
                    : 'bg-[#1a1a2e]/80 border-[#0f3460] text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className={`text-xs font-black ${isSelected ? diff.color : 'text-gray-300'}`}>
                  {diff.label.split(' ')[0]}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {diff.id === 'NORMAL' ? '1.0x' : diff.id === 'HARD' ? '1.4x' : '1.8x'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
