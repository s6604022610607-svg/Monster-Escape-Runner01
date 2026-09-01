export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type LaneIndex = 0 | 1 | 2; // 0: Left, 1: Middle, 2: Right

export type ObstacleType = 'ROCK' | 'BARRICADE' | 'SPIKES';

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'MULTIPLIER';

export type CharacterSkin = 'CYBER_PUNK' | 'NEON_BLAZE' | 'STEALTH_SHADOW' | 'GOLDEN_CHAMPION';

export type DifficultyLevel = 'NORMAL' | 'HARD' | 'EXTREME';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  distance: number;
  coins: number;
  date: string;
  skin: CharacterSkin;
}

export interface Obstacle {
  id: number;
  lane: LaneIndex;
  y: number; // Distance from top of track
  type: ObstacleType;
  width: number;
  height: number;
  canJumpOver: boolean;
  passed: boolean;
}

export interface Coin {
  id: number;
  lane: LaneIndex;
  y: number;
  collected: boolean;
  frame: number;
}

export interface PowerUpItem {
  id: number;
  lane: LaneIndex;
  y: number;
  type: PowerUpType;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ActivePowerUps {
  magnetTimer: number;
  shieldActive: boolean;
  multiplierTimer: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  distance: number;
  coins: number;
  speed: number;
}
