import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface OnScreenControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  disabled?: boolean;
}

export const OnScreenControls: React.FC<OnScreenControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  disabled = false,
}) => {
  const [activeBtn, setActiveBtn] = useState<'left' | 'jump' | 'right' | null>(null);

  const handleAction = (type: 'left' | 'jump' | 'right', action: () => void) => {
    if (disabled) return;
    setActiveBtn(type);
    action();
    setTimeout(() => setActiveBtn(null), 150);
  };

  return (
    <div
      id="mobile-game-controls"
      className="w-full max-w-[480px] px-3 sm:px-4 py-3 sm:py-4 bg-[#16213e] border-t-2 border-[#0f3460] select-none flex flex-col gap-2 z-10"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Control Area Bar Header */}
      <div className="flex items-center justify-between text-[11px] px-1 text-gray-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>TOUCH CONTROLS</span>
        </span>
        <span className="text-gray-400 font-sans text-[10px]">
          {disabled ? 'เริ่มเกมเพื่อควบคุม' : 'แตะเพื่อเปลี่ยนเลน / กระโดด'}
        </span>
      </div>

      {/* Button Layout: 3-column tactile arcade console */}
      <div className="flex items-stretch justify-between gap-2 sm:gap-3 w-full">
        {/* Move Left Button (เลี้ยวซ้าย) */}
        <button
          id="btn-control-left"
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            handleAction('left', onMoveLeft);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleAction('left', onMoveLeft);
          }}
          aria-label="เปลี่ยนเลนไปทางซ้าย"
          className={`flex-1 min-h-[64px] sm:min-h-[72px] py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-75 select-none touch-manipulation cursor-pointer border-2 ${
            disabled
              ? 'opacity-40 bg-[#0f3460]/40 border-gray-700 cursor-not-allowed'
              : activeBtn === 'left'
              ? 'bg-[#1a3b68] border-[#4cc9f0] translate-y-1 shadow-inner'
              : 'bg-[#0f3460] hover:bg-[#162f54] active:bg-[#1a3b68] border-[#1f4b82] border-b-4 border-b-[#081b33] shadow-lg shadow-black/40 hover:shadow-cyan-900/20 active:border-b-2 active:translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-center text-white">
            <ChevronLeft className="w-4 h-4 text-[#4cc9f0] -mr-1" />
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.5]" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-200 tracking-wider uppercase leading-tight font-mono">
            LEFT
          </span>
          <span className="text-[9px] text-gray-400 font-sans leading-none">
            (เลนซ้าย)
          </span>
        </button>

        {/* Jump Button (กระโดด - Highlighted with Crimson Arcade Glow) */}
        <button
          id="btn-control-jump"
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            handleAction('jump', onJump);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleAction('jump', onJump);
          }}
          aria-label="กระโดดหลบสิ่งกีดขวาง"
          className={`flex-[1.25] min-h-[64px] sm:min-h-[72px] py-2.5 px-3 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-75 select-none touch-manipulation cursor-pointer border-2 ${
            disabled
              ? 'opacity-40 bg-[#e94560]/40 border-gray-700 cursor-not-allowed'
              : activeBtn === 'jump'
              ? 'bg-[#ff5e78] border-white translate-y-1 shadow-inner'
              : 'bg-[#e94560] hover:bg-[#ff5e78] active:bg-[#d6344d] border-[#ff758c] border-b-4 border-b-[#8c1d30] shadow-xl shadow-[#e94560]/35 active:border-b-2 active:translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-center text-white relative">
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[3] drop-shadow" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-3 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-black text-white tracking-widest uppercase leading-tight font-mono">
            JUMP
          </span>
          <span className="text-[10px] text-red-100 font-sans font-semibold leading-none">
            (กระโดด)
          </span>
        </button>

        {/* Move Right Button (เลี้ยวขวา) */}
        <button
          id="btn-control-right"
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            handleAction('right', onMoveRight);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            handleAction('right', onMoveRight);
          }}
          aria-label="เปลี่ยนเลนไปทางขวา"
          className={`flex-1 min-h-[64px] sm:min-h-[72px] py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-75 select-none touch-manipulation cursor-pointer border-2 ${
            disabled
              ? 'opacity-40 bg-[#0f3460]/40 border-gray-700 cursor-not-allowed'
              : activeBtn === 'right'
              ? 'bg-[#1a3b68] border-[#4cc9f0] translate-y-1 shadow-inner'
              : 'bg-[#0f3460] hover:bg-[#162f54] active:bg-[#1a3b68] border-[#1f4b82] border-b-4 border-b-[#081b33] shadow-lg shadow-black/40 hover:shadow-cyan-900/20 active:border-b-2 active:translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-center text-white">
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.5]" />
            <ChevronRight className="w-4 h-4 text-[#4cc9f0] -ml-1" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-200 tracking-wider uppercase leading-tight font-mono">
            RIGHT
          </span>
          <span className="text-[9px] text-gray-400 font-sans leading-none">
            (เลนขวา)
          </span>
        </button>
      </div>
    </div>
  );
};

