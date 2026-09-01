import React from 'react';
import { Gamepad2, Shield, Magnet, Zap, Keyboard, Smartphone, Activity } from 'lucide-react';

export const InstructionBox: React.FC = () => {
  return (
    <div
      id="game-instruction-box"
      className="w-full max-w-[480px] bg-[#16213e] border-2 border-[#0f3460] rounded-2xl p-4 shadow-xl text-gray-300 space-y-3"
    >
      <div className="flex items-center justify-between border-b border-[#0f3460] pb-2.5">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-[#e94560]" />
          <h3 className="text-sm font-black text-[#e94560] uppercase tracking-widest">
            วิธีเล่นและกติกาเกม (Instructions)
          </h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#0f3460] text-gray-300 font-bold">
          2D Runner
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Controls */}
        <div className="bg-[#0f3460]/40 p-3 rounded-xl border border-[#0f3460] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
            <Keyboard className="w-4 h-4 text-[#e94560]" />
            <span>คีย์บอร์ด (Desktop)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
            <li><kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">←</kbd> หรือ <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">A</kbd> : เลี้ยวซ้าย</li>
            <li><kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">→</kbd> หรือ <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">D</kbd> : เลี้ยวขวา</li>
            <li><kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] border border-[#0f3460] rounded text-white font-mono font-bold">↑</kbd> : กระโดด</li>
          </ul>
        </div>

        {/* Mobile controls */}
        <div className="bg-[#0f3460]/40 p-3 rounded-xl border border-[#0f3460] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>ทัชสกรีน (Mobile)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
            <li>แตะปุ่ม <span className="text-white font-bold">LEFT / RIGHT</span> หรือปัดนิ้วซ้าย-ขวา</li>
            <li>แตะปุ่มสีแดง <span className="text-[#ff5e78] font-bold">JUMP</span> หรือปัดนิ้วขึ้น</li>
          </ul>
        </div>
      </div>

      {/* Rules & Obstacles guide */}
      <div className="bg-[#0f3460]/30 p-3 rounded-xl border border-[#0f3460] text-xs space-y-2">
        <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
          <span>⚠️</span> กฎสำคัญ &amp; สิ่งกีดขวาง:
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
          <div className="flex items-start gap-1.5 bg-[#1a1a2e]/60 p-1.5 rounded-lg border border-[#0f3460]/50">
            <span className="text-base">🪨</span>
            <div>
              <span className="font-bold text-white">หิน / หนาม:</span>
              <p className="text-gray-400">กระโดดข้ามหรือเลี้ยวหลบ</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5 bg-[#1a1a2e]/60 p-1.5 rounded-lg border border-[#0f3460]/50">
            <span className="text-base">🚧</span>
            <div>
              <span className="font-bold text-[#ff5e78]">ป้ายกั้นสูง:</span>
              <p className="text-gray-400">ต้อง <span className="text-[#e94560] font-bold">เปลี่ยนเลนหลบ</span></p>
            </div>
          </div>
        </div>

        {/* Powerups row */}
        <div className="flex items-center justify-between pt-2 border-t border-[#0f3460]/60 text-[11px]">
          <div className="flex items-center gap-1 text-yellow-300 font-medium">
            <span>✨</span> เหรียญ (+50)
          </div>
          <div className="flex items-center gap-1 text-pink-300 font-medium">
            <Magnet className="w-3 h-3 text-[#ff5e78]" /> แม่เหล็ก
          </div>
          <div className="flex items-center gap-1 text-cyan-300 font-medium">
            <Shield className="w-3 h-3 text-[#4cc9f0]" /> โล่ป้องกัน
          </div>
          <div className="flex items-center gap-1 text-amber-300 font-medium">
            <Zap className="w-3 h-3 text-amber-400" /> คะแนน x2
          </div>
        </div>
      </div>

      {/* Responsive Engine Active Badge */}
      <div className="bg-black/40 p-2.5 rounded-xl border border-[#0f3460] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400 font-bold text-[11px] tracking-wider">
            ● RESPONSIVE ENGINE ACTIVE
          </span>
        </div>
        <span className="font-mono text-[10px] text-gray-400">60 FPS • LOW LATENCY</span>
      </div>
    </div>
  );
};
