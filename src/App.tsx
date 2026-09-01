import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './gameEngine';
import { sound } from './audio';
import { ActivePowerUps, CharacterSkin, DifficultyLevel, GameStats, GameState, LeaderboardEntry } from './types';
import { HeaderHUD } from './components/HeaderHUD';
import { OnScreenControls } from './components/OnScreenControls';
import { InstructionBox } from './components/InstructionBox';
import { GameOverModal } from './components/GameOverModal';
import { RunnerCustomizer } from './components/RunnerCustomizer';
import { LeaderboardSection } from './components/LeaderboardSection';
import { Play, Flame, Trophy, Volume2, Sparkles, User } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Touch tracking for swipe gestures
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // React State for UI
  const [gameState, setGameState] = useState<GameState>('START');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // User Customization & Form Interactions
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('runner_player_name') || 'CYBER_RUNNER';
    } catch {
      return 'CYBER_RUNNER';
    }
  });

  const [characterSkin, setCharacterSkin] = useState<CharacterSkin>(() => {
    try {
      return (localStorage.getItem('runner_skin') as CharacterSkin) || 'CYBER_PUNK';
    } catch {
      return 'CYBER_PUNK';
    }
  });

  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => {
    try {
      return (localStorage.getItem('runner_difficulty') as DifficultyLevel) || 'NORMAL';
    } catch {
      return 'NORMAL';
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('runner_leaderboard');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    distance: 0,
    coins: 0,
    speed: 6,
  });

  const [powerUps, setPowerUps] = useState<ActivePowerUps>({
    magnetTimer: 0,
    shieldActive: false,
    multiplierTimer: 0,
  });

  // Handle Player Name Change
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    try {
      localStorage.setItem('runner_player_name', name);
    } catch {}
  };

  // Handle Skin Change
  const handleSkinChange = (skin: CharacterSkin) => {
    setCharacterSkin(skin);
    if (engineRef.current) {
      engineRef.current.characterSkin = skin;
    }
    try {
      localStorage.setItem('runner_skin', skin);
    } catch {}
  };

  // Handle Difficulty Change
  const handleDifficultyChange = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    if (engineRef.current) {
      engineRef.current.difficulty = diff;
    }
    try {
      localStorage.setItem('runner_difficulty', diff);
    } catch {}
  };

  // Clear Leaderboard
  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    try {
      localStorage.removeItem('runner_leaderboard');
    } catch {}
  };

  // Initialize Game Canvas & Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Retina / High-DPI canvas setup
    const dpr = window.devicePixelRatio || 1;
    const width = 440;
    const height = 660;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${width}px`;
    canvas.style.aspectRatio = `${width} / ${height}`;

    const engine = new GameEngine(canvas);
    engine.ctx.scale(dpr, dpr);
    engine.characterSkin = characterSkin;
    engine.difficulty = difficulty;
    engineRef.current = engine;

    // Load initial highscore
    engine.loadHighScore();
    setStats((prev) => ({
      ...prev,
      highScore: engine.highScore,
    }));

    // Engine Callbacks
    engine.onStatsUpdate = (newStats, newPowerUps) => {
      setStats(newStats);
      setPowerUps({ ...newPowerUps });
    };

    engine.onGameOver = (finalStats) => {
      const isNewBest = finalStats.score >= finalStats.highScore && finalStats.score > 0;
      setIsNewHighScore(isNewBest);
      setGameState('GAMEOVER');

      // Save entry to leaderboard
      if (finalStats.score > 0) {
        const newEntry: LeaderboardEntry = {
          playerName: playerName.trim() || 'Anonymous Runner',
          score: finalStats.score,
          distance: finalStats.distance,
          coins: finalStats.coins,
          date: new Date().toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          skin: engine.characterSkin,
        };

        setLeaderboard((prev) => {
          const updated = [...prev, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          try {
            localStorage.setItem('runner_leaderboard', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    };

    // Initial render for start screen background
    engine.render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      sound.stopBGM();
    };
  }, []);

  // Main 60fps Game Loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const elapsed = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Normalize delta time (target 60fps ~ 16.6ms)
    const dt = Math.min(2.5, elapsed / 16.66);

    const engine = engineRef.current;
    if (engine) {
      engine.update(dt);
      engine.render();
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start / Resume Loop
  const startGame = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.resetGame();
    setGameState('PLAYING');
    setIsNewHighScore(false);
    lastTimeRef.current = performance.now();

    if (!isMuted) {
      sound.startBGM();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const restartGame = () => {
    startGame();
  };

  const togglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (gameState === 'PLAYING') {
      engine.isRunning = false;
      setGameState('PAUSED');
      sound.stopBGM();
    } else if (gameState === 'PAUSED') {
      engine.isRunning = true;
      setGameState('PLAYING');
      lastTimeRef.current = performance.now();
      if (!isMuted) sound.startBGM();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (nextMuted) {
      sound.stopBGM();
    } else if (gameState === 'PLAYING') {
      sound.startBGM();
    }
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent page scrolling on arrow keys & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (gameState === 'START' || gameState === 'GAMEOVER') {
        if (e.key === ' ' || e.key === 'Enter') {
          startGame();
        }
        return;
      }

      if (gameState === 'PLAYING') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          engine.moveLeft();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          engine.moveRight();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          engine.jump();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isMuted]);

  // Touch & Swipe Controls on Canvas
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'PLAYING') return;
    const engine = engineRef.current;
    if (!engine) return;

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartXRef.current;
    const diffY = touch.clientY - touchStartYRef.current;

    const minSwipeDist = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > minSwipeDist) {
        engine.moveRight();
      } else if (diffX < -minSwipeDist) {
        engine.moveLeft();
      }
    } else {
      // Vertical swipe or tap
      if (diffY < -minSwipeDist) {
        // Swipe Up -> Jump
        engine.jump();
      } else if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) {
        // Simple tap on canvas -> Jump
        engine.jump();
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a2e] text-white flex flex-col items-center justify-start p-2 sm:p-4 selection:bg-[#e94560] selection:text-white">
      {/* App Header Title */}
      <header className="w-full max-w-[480px] text-center my-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">🏃💨</span>
          <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-[#e94560] drop-shadow-md">
            MONSTER ESCAPE
          </h1>
          <span className="text-3xl">👾</span>
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
          Subway Runner 2D Edition • วิ่งหนีสัตว์ประหลาด 3 เลน
        </p>
      </header>

      {/* Main Game Container */}
      <div
        id="game-viewport-card"
        className="w-full max-w-[480px] bg-[#16213e] border-4 border-[#0f3460] rounded-3xl cyber-card-glow overflow-hidden flex flex-col items-center relative"
      >
        {/* HUD Top Bar */}
        <HeaderHUD
          stats={stats}
          powerUps={powerUps}
          isMuted={isMuted}
          isPaused={gameState === 'PAUSED'}
          onToggleMute={toggleMute}
          onTogglePause={togglePause}
        />

        {/* Canvas Game Area */}
        <div className="relative w-full flex items-center justify-center bg-[#242444] overflow-hidden">
          <canvas
            ref={canvasRef}
            id="monster-runner-canvas"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full max-w-[440px] block cursor-pointer"
          />

          {/* START SCREEN OVERLAY */}
          {gameState === 'START' && (
            <div
              id="start-screen-overlay"
              className="absolute inset-0 bg-[#1a1a2e]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
            >
              <div className="w-full max-w-xs bg-[#16213e] border-2 border-[#e94560] rounded-3xl p-6 shadow-[0_0_50px_rgba(233,69,96,0.3)] flex flex-col items-center space-y-4">
                {/* Monster and Runner Icon Header */}
                <div className="flex items-center justify-center gap-3">
                  <div className="w-14 h-14 bg-[#0f3460] border-2 border-[#4cc9f0] rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    🏃
                  </div>
                  <span className="text-xl font-black text-[#e94560]">VS</span>
                  <div className="w-14 h-14 bg-[#e94560]/20 border-2 border-[#e94560] rounded-2xl flex items-center justify-center text-3xl shadow-lg animate-bounce">
                    👾
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-[#e94560] italic tracking-tight">
                    READY TO RUN?
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 font-medium">
                    สัตว์ประหลาดกำลังไล่ล่าคุณ! หลบก้อนหินและสิ่งกีดขวาง 3 เลนให้ทัน
                  </p>
                </div>

                {/* High Score Banner */}
                {stats.highScore > 0 && (
                  <div className="w-full bg-[#0f3460] border border-[#e94560]/50 rounded-xl p-2.5 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold font-mono">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>HIGH SCORE: {stats.highScore.toLocaleString()}</span>
                  </div>
                )}

                {/* Start Button (ปุ่ม 'เริ่มเกม') */}
                <button
                  id="btn-start-game"
                  type="button"
                  onClick={startGame}
                  className="w-full py-4 px-6 bg-[#e94560] hover:bg-[#ff5e78] active:bg-[#a52a3f] text-white font-black text-xl rounded-full shadow-xl shadow-[#e94560]/40 flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer hover:scale-105"
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span className="tracking-wide">START GAME</span>
                </button>

                <p className="text-[11px] text-gray-400 font-mono">
                  กด <kbd className="px-1.5 py-0.5 bg-[#0f3460] border border-gray-600 rounded font-mono text-white">Space</kbd> หรือแตะเพื่อเริ่ม
                </p>
              </div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === 'PAUSED' && (
            <div
              id="pause-screen-overlay"
              className="absolute inset-0 bg-[#1a1a2e]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
            >
              <div className="bg-[#16213e] border-2 border-[#0f3460] rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-3 max-w-xs w-full">
                <h3 className="text-2xl font-black text-white italic tracking-tight">PAUSED</h3>
                <p className="text-xs text-gray-300">พักหายใจสักนิด แล้ววิ่งต่อ!</p>
                <button
                  id="btn-resume-game"
                  type="button"
                  onClick={togglePause}
                  className="w-full py-3 bg-[#e94560] hover:bg-[#ff5e78] text-white font-bold rounded-full text-base shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  RESUME (เล่นต่อ)
                </button>
              </div>
            </div>
          )}

          {/* GAME OVER MODAL (ปุ่ม 'เล่นใหม่') */}
          {gameState === 'GAMEOVER' && (
            <GameOverModal
              stats={stats}
              isNewHighScore={isNewHighScore}
              playerName={playerName}
              onRestart={restartGame}
            />
          )}
        </div>

        {/* On-Screen Mobile Controls (ซ้าย, กระโดด, ขวา) */}
        <OnScreenControls
          onMoveLeft={() => engineRef.current?.moveLeft()}
          onMoveRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          disabled={gameState !== 'PLAYING'}
        />
      </div>

      {/* Runner Customizer Panel (Player Name, Skin Picker, Difficulty Level) */}
      <div className="w-full max-w-[480px] mt-4">
        <RunnerCustomizer
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          characterSkin={characterSkin}
          onSkinChange={handleSkinChange}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          isGamePlaying={gameState === 'PLAYING'}
        />
      </div>

      {/* Leaderboard / High Scores Section */}
      <div className="w-full max-w-[480px] mt-4">
        <LeaderboardSection
          entries={leaderboard}
          onClear={handleClearLeaderboard}
        />
      </div>

      {/* Instruction & Rules Box */}
      <div className="w-full max-w-[480px] mt-4 mb-6">
        <InstructionBox />
      </div>
    </main>
  );
}
