import { sound } from './audio';
import { ActivePowerUps, CharacterSkin, Coin, DifficultyLevel, GameStats, LaneIndex, Obstacle, ObstacleType, Particle, PowerUpItem, PowerUpType } from './types';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  // Viewport
  public width: number = 440;
  public height: number = 660;

  // Customization & Settings
  public characterSkin: CharacterSkin = 'CYBER_PUNK';
  public difficulty: DifficultyLevel = 'NORMAL';

  // State
  public isRunning: boolean = false;
  public isGameOver: boolean = false;
  public score: number = 0;
  public highScore: number = 0;
  public distance: number = 0;
  public coinsCount: number = 0;
  public speed: number = 6;
  public baseSpeed: number = 6;
  public maxSpeed: number = 16;

  // Lane coordinates (X positions for 3 lanes)
  public laneWidth: number = 100;
  public roadLeft: number = 70;
  public roadRight: number = 370;
  public laneCenters: number[] = [120, 220, 320];

  // Player Jump Physics (Snappy, realistic parabolic gravity trajectory)
  public playerLane: LaneIndex = 1;
  public playerTargetX: number = 220;
  public playerX: number = 220;
  public playerY: number = 440;
  public playerJumpY: number = 0; // Height in pixels above the road
  public playerVy: number = 0; // Vertical velocity (positive = ascending, negative = descending)
  public isJumping: boolean = false;
  public gravity: number = 0.82; // Downward gravity acceleration
  public jumpForce: number = 14.5; // Initial upward launch velocity
  public runFrame: number = 0;
  public playerScale: number = 1;

  // Monster (Chaser)
  public monsterX: number = 220;
  public monsterY: number = 565;
  public monsterLane: LaneIndex = 1;
  public monsterFrame: number = 0;
  public monsterCatchProgress: number = 0;
  public isMonsterCatching: boolean = false;

  // Entities
  public obstacles: Obstacle[] = [];
  public coins: Coin[] = [];
  public powerUps: PowerUpItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: { x: number; y: number; text: string; color: string; life: number }[] = [];

  // Power-up states
  public powerUpState: ActivePowerUps = {
    magnetTimer: 0,
    shieldActive: false,
    multiplierTimer: 0,
  };

  // Environment & Scenery
  public roadOffset: number = 0;
  public cityOffset: number = 0;
  public stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];
  public sceneryItems: { y: number; side: 'left' | 'right'; type: number }[] = [];
  public ghostTrails: { x: number; y: number; jumpY: number; frame: number; alpha: number; color: string }[] = [];

  // Timers & IDs
  private nextObstacleDist: number = 0;
  private nextEntityId: number = 1;
  private screenShake: number = 0;
  private monsterRoarTimer: number = 0;

  // Callbacks
  public onGameOver?: (stats: GameStats) => void;
  public onStatsUpdate?: (stats: GameStats, powerUps: ActivePowerUps) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;
    this.loadHighScore();
    this.initScenery();
  }

  public loadHighScore() {
    try {
      const saved = localStorage.getItem('monster_runner_high_score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.highScore = 0;
    }
  }

  public saveHighScore() {
    try {
      if (this.score > this.highScore) {
        this.highScore = Math.floor(this.score);
        localStorage.setItem('monster_runner_high_score', this.highScore.toString());
      }
    } catch {
      // Ignore local storage error
    }
  }

  private initScenery() {
    this.sceneryItems = [];
    for (let y = 0; y < this.height + 100; y += 120) {
      this.sceneryItems.push({
        y,
        side: 'left',
        type: Math.floor(Math.random() * 3),
      });
      this.sceneryItems.push({
        y: y + 60,
        side: 'right',
        type: Math.floor(Math.random() * 3),
      });
    }

    // Initialize parallax twinkling stars
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * 110,
        size: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.02,
      });
    }
  }

  public resetGame() {
    this.score = 0;
    this.distance = 0;
    this.coinsCount = 0;
    
    // Set speed based on difficulty level
    if (this.difficulty === 'NORMAL') {
      this.baseSpeed = 6;
      this.maxSpeed = 16;
    } else if (this.difficulty === 'HARD') {
      this.baseSpeed = 8.5;
      this.maxSpeed = 20;
    } else if (this.difficulty === 'EXTREME') {
      this.baseSpeed = 11;
      this.maxSpeed = 24;
    }

    this.speed = this.baseSpeed;
    this.isGameOver = false;
    this.isRunning = true;
    this.isMonsterCatching = false;
    this.monsterCatchProgress = 0;

    this.playerLane = 1;
    this.playerX = this.laneCenters[1];
    this.playerTargetX = this.laneCenters[1];
    this.playerJumpY = 0;
    this.playerVy = 0;
    this.isJumping = false;

    this.monsterX = this.laneCenters[1];
    this.monsterY = 565;
    this.monsterLane = 1;

    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
    this.particles = [];
    this.floatingTexts = [];
    this.ghostTrails = [];
    this.screenShake = 0;

    this.powerUpState = {
      magnetTimer: 0,
      shieldActive: false,
      multiplierTimer: 0,
    };

    this.nextObstacleDist = 80;
    this.initScenery();
  }

  // --- Input Handlers with Strict 3-Lane Boundary Enforcement ---
  public moveLeft() {
    if (!this.isRunning || this.isGameOver) return;
    if (this.playerLane > 0) {
      // Clamp strictly within [0, 2]
      this.playerLane = Math.max(0, this.playerLane - 1) as LaneIndex;
      this.playerTargetX = this.laneCenters[this.playerLane];
      sound.playSwitchLane();
      this.createLaneDust(this.playerX, this.playerY + 20);
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isGameOver) return;
    if (this.playerLane < 2) {
      // Clamp strictly within [0, 2]
      this.playerLane = Math.min(2, this.playerLane + 1) as LaneIndex;
      this.playerTargetX = this.laneCenters[this.playerLane];
      sound.playSwitchLane();
      this.createLaneDust(this.playerX, this.playerY + 20);
    }
  }

  public setLane(lane: number) {
    if (!this.isRunning || this.isGameOver) return;
    const clampedLane = Math.max(0, Math.min(2, Math.round(lane))) as LaneIndex;
    if (this.playerLane !== clampedLane) {
      this.playerLane = clampedLane;
      this.playerTargetX = this.laneCenters[this.playerLane];
      sound.playSwitchLane();
      this.createLaneDust(this.playerX, this.playerY + 20);
    }
  }

  public jump() {
    if (!this.isRunning || this.isGameOver) return;
    // Allow jump only when player is on the ground
    if (!this.isJumping && this.playerJumpY <= 0.5) {
      this.isJumping = true;
      this.playerVy = this.jumpForce;
      sound.playJump();
      this.createJumpDust(this.playerX, this.playerY + 15);
    }
  }

  // --- Update Loop ---
  public update(dt: number = 1) {
    if (!this.isRunning) return;

    if (this.isGameOver) {
      this.updateGameOverCatch(dt);
      return;
    }

    // Increase distance & score
    const scoreMultiplier = this.powerUpState.multiplierTimer > 0 ? 2 : 1;
    this.distance += (this.speed * dt) / 10;
    this.score += (this.speed * 0.15 * scoreMultiplier) * dt;
    this.saveHighScore();

    // Speed progression (gradual increase up to max)
    this.speed = Math.min(this.maxSpeed, this.baseSpeed + Math.floor(this.distance / 120) * 0.45);

    // Update powerups countdown
    if (this.powerUpState.magnetTimer > 0) {
      this.powerUpState.magnetTimer -= dt / 60;
      if (this.powerUpState.magnetTimer <= 0) this.powerUpState.magnetTimer = 0;
    }
    if (this.powerUpState.multiplierTimer > 0) {
      this.powerUpState.multiplierTimer -= dt / 60;
      if (this.powerUpState.multiplierTimer <= 0) this.powerUpState.multiplierTimer = 0;
    }

    // Ensure lane index stays strictly within 3 lanes [0, 1, 2] (Left=0, Center=1, Right=2)
    this.playerLane = Math.max(0, Math.min(2, this.playerLane)) as LaneIndex;
    this.playerTargetX = this.laneCenters[this.playerLane];

    // Player position interpolation (smooth lane change)
    this.playerX += (this.playerTargetX - this.playerX) * 0.28 * dt;

    // Hard boundary clamping: player can never cross outside road/lane limits
    const minLaneX = this.laneCenters[0]; // 120 (Left lane)
    const maxLaneX = this.laneCenters[2]; // 320 (Right lane)
    this.playerX = Math.max(minLaneX, Math.min(maxLaneX, this.playerX));

    // Monster position follows smoothly with slight delay and stays within road boundaries
    this.monsterX += (this.playerX - this.monsterX) * 0.15 * dt;
    this.monsterX = Math.max(minLaneX, Math.min(maxLaneX, this.monsterX));

    // Player jump physics (Realistic parabolic gravity arc)
    if (this.isJumping || this.playerJumpY > 0) {
      this.playerJumpY += this.playerVy * dt;
      this.playerVy -= this.gravity * dt; // Gravity continuously pulls the character back down

      // Touchdown on the road surface
      if (this.playerJumpY <= 0) {
        this.playerJumpY = 0;
        this.playerVy = 0;
        this.isJumping = false;
        this.createJumpDust(this.playerX, this.playerY + 15);
      }
    }

    // Animation frames
    this.runFrame += (this.speed * 0.12) * dt;
    this.monsterFrame += (this.speed * 0.14) * dt;

    // Road scrolling offset & parallax skyline offset
    this.roadOffset = (this.roadOffset + this.speed * dt) % 60;
    this.cityOffset = (this.cityOffset + this.speed * 0.08 * dt) % 240;

    // Player ghost trail generation (Cool speed shadow silhouette)
    if (this.speed > 7.5 || this.isJumping || Math.abs(this.playerTargetX - this.playerX) > 3) {
      if (Math.floor(this.runFrame * 4) % 2 === 0) {
        this.ghostTrails.push({
          x: this.playerX,
          y: this.playerY,
          jumpY: this.playerJumpY,
          frame: this.runFrame,
          alpha: 0.45,
          color: this.powerUpState.shieldActive ? '#38bdf8' : this.powerUpState.multiplierTimer > 0 ? '#f59e0b' : '#e94560',
        });
      }
    }
    // Update and fade ghost trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      this.ghostTrails[i].alpha -= 0.05 * dt;
      this.ghostTrails[i].y += (this.speed * 0.25) * dt;
      if (this.ghostTrails[i].alpha <= 0) {
        this.ghostTrails.splice(i, 1);
      }
    }

    // Runner sneaker sparks on footfall
    if (!this.isJumping && Math.floor(this.runFrame * 2) % 3 === 0) {
      const isLeft = Math.sin(this.runFrame) > 0;
      this.particles.push({
        x: this.playerX + (isLeft ? -8 : 8),
        y: this.playerY + 16,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        size: 2 + Math.random() * 2.5,
        color: isLeft ? '#4cc9f0' : '#e94560',
        alpha: 0.75,
        life: 0,
        maxLife: 10,
      });
    }

    // Monster footstep stomp dust & mouth embers
    this.monsterRoarTimer += dt;
    if (Math.floor(this.monsterFrame * 2) % 3 === 0) {
      const stompX = this.monsterX + (Math.sin(this.monsterFrame) > 0 ? -20 : 20);
      this.particles.push({
        x: stompX,
        y: this.monsterY + 24,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2 + 1,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#991b1b' : '#701a75',
        alpha: 0.6,
        life: 0,
        maxLife: 14,
      });
      // Fire saliva ember from monster jaw
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.monsterX + (Math.random() - 0.5) * 16,
          y: this.monsterY - 6,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          size: 2.5 + Math.random() * 2,
          color: '#f97316',
          alpha: 0.85,
          life: 0,
          maxLife: 12,
        });
      }
    }

    // Update Scenery
    for (const item of this.sceneryItems) {
      item.y += this.speed * dt;
      if (item.y > this.height + 60) {
        item.y = -60;
        item.type = Math.floor(Math.random() * 3);
      }
    }

    // Spawn Obstacles & Coins
    this.updateSpawning(dt);

    // Update & check collisions with Obstacles
    this.updateObstacles(dt);

    // Update & check Coins
    this.updateCoins(dt);

    // Update & check Power-ups
    this.updatePowerUps(dt);

    // Update Particles & Floating Text
    this.updateParticles(dt);

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.8 * dt);
    }

    // Emit stats for UI updates
    if (this.onStatsUpdate) {
      this.onStatsUpdate(
        {
          score: Math.floor(this.score),
          highScore: Math.floor(this.highScore),
          distance: Math.floor(this.distance),
          coins: this.coinsCount,
          speed: parseFloat(this.speed.toFixed(1)),
        },
        this.powerUpState
      );
    }
  }

  // --- Spawning Logic ---
  private updateSpawning(dt: number) {
    this.nextObstacleDist -= this.speed * dt;

    if (this.nextObstacleDist <= 0) {
      // Spawn obstacle pattern
      const lanes: LaneIndex[] = [0, 1, 2];
      const blockedLaneCount = Math.random() < 0.35 && this.distance > 200 ? 2 : 1;
      
      // Shuffle lanes
      lanes.sort(() => Math.random() - 0.5);

      for (let i = 0; i < blockedLaneCount; i++) {
        const lane = lanes[i];
        const randType = Math.random();
        let type: ObstacleType = 'ROCK';

        if (randType < 0.45) {
          type = 'ROCK'; // Jumpable or dodgeable
        } else if (randType < 0.75) {
          type = 'BARRICADE'; // Tall hazard: CANNOT jump over, must dodge!
        } else {
          type = 'SPIKES'; // Spikes: Jumpable or dodgeable
        }

        this.obstacles.push({
          id: this.nextEntityId++,
          lane,
          y: -80,
          type,
          width: 54,
          height: type === 'BARRICADE' ? 58 : 42,
          canJumpOver: type !== 'BARRICADE',
          passed: false,
        });
      }

      // In the free lane, maybe spawn a coin line or a powerup!
      const freeLane = lanes[blockedLaneCount < 2 ? 1 : 2];
      if (Math.random() < 0.7) {
        // Spawn line of 3 coins
        for (let c = 0; c < 3; c++) {
          this.coins.push({
            id: this.nextEntityId++,
            lane: freeLane,
            y: -120 - c * 40,
            collected: false,
            frame: 0,
          });
        }
      } else if (Math.random() < 0.3) {
        // Spawn Power-Up item
        const pTypes: PowerUpType[] = ['MAGNET', 'SHIELD', 'MULTIPLIER'];
        const selectedType = pTypes[Math.floor(Math.random() * pTypes.length)];
        this.powerUps.push({
          id: this.nextEntityId++,
          lane: freeLane,
          y: -120,
          type: selectedType,
          collected: false,
        });
      }

      // Next spawn distance (tightens as speed increases)
      const baseGap = Math.max(160, 320 - this.speed * 10);
      this.nextObstacleDist = baseGap + Math.random() * 100;
    }
  }

  // --- Obstacles Update & Collision ---
  private updateObstacles(dt: number) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.speed * dt;

      const obsX = this.laneCenters[obs.lane];
      const obsY = obs.y;

      // Check collision with player
      // Player bounding box
      const playerRadius = 24;
      const xDist = Math.abs(this.playerX - obsX);
      const yDist = Math.abs(this.playerY - obsY);

      if (xDist < 36 && yDist < 30) {
        // Check if player is jumping over a low obstacle (rocks/spikes)
        const jumpedHighEnough = this.playerJumpY > 24;

        if (obs.canJumpOver && jumpedHighEnough) {
          // Safely sailed over the rock/spikes!
          if (!obs.passed) {
            obs.passed = true;
            this.addFloatingText(this.playerX, this.playerY - 40, 'JUMP! +20', '#38bdf8');
            this.score += 20;
          }
        } else {
          // Collision occurred!
          if (this.powerUpState.shieldActive) {
            // Shield absorbs the hit!
            this.powerUpState.shieldActive = false;
            sound.playShieldBreak();
            this.screenShake = 12;
            this.createExplosion(obsX, obsY, '#38bdf8', 16);
            this.obstacles.splice(i, 1);
            this.addFloatingText(this.playerX, this.playerY - 40, 'SHIELD SAVED!', '#38bdf8');
            continue;
          } else {
            // Player hit obstacle -> Monster caught player -> Game Over!
            this.triggerGameOver();
            return;
          }
        }
      }

      // Remove passed obstacles
      if (obs.y > this.height + 100) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  // --- Coins Update & Magnet Pull ---
  private updateCoins(dt: number) {
    const isMagnetActive = this.powerUpState.magnetTimer > 0;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.y += this.speed * dt;
      coin.frame += 0.2 * dt;

      const coinX = this.laneCenters[coin.lane];
      let currentCoinX = coinX;

      // Magnet effect pulls coin towards player
      if (isMagnetActive) {
        const dx = this.playerX - currentCoinX;
        const dy = this.playerY - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 260) {
          currentCoinX += (dx / dist) * 12 * dt;
          coin.y += (dy / dist) * 12 * dt;
        }
      }

      // Collection check
      const xDist = Math.abs(this.playerX - currentCoinX);
      const yDist = Math.abs(this.playerY - coin.y);

      if (xDist < 32 && yDist < 32 && !coin.collected) {
        coin.collected = true;
        this.coinsCount++;
        this.score += 50;
        sound.playCoin();
        this.createCoinSparkles(currentCoinX, coin.y);
        this.addFloatingText(currentCoinX, coin.y - 15, '+50', '#fbbf24');
        this.coins.splice(i, 1);
        continue;
      }

      if (coin.y > this.height + 50) {
        this.coins.splice(i, 1);
      }
    }
  }

  // --- Power-ups Update ---
  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const item = this.powerUps[i];
      item.y += this.speed * dt;

      const itemX = this.laneCenters[item.lane];
      const xDist = Math.abs(this.playerX - itemX);
      const yDist = Math.abs(this.playerY - item.y);

      if (xDist < 36 && yDist < 36 && !item.collected) {
        item.collected = true;
        sound.playPowerUp();

        if (item.type === 'MAGNET') {
          this.powerUpState.magnetTimer = 8;
          this.addFloatingText(this.playerX, this.playerY - 40, '🧲 MAGNET!', '#ec4899');
          this.createExplosion(itemX, item.y, '#ec4899', 14);
        } else if (item.type === 'SHIELD') {
          this.powerUpState.shieldActive = true;
          this.addFloatingText(this.playerX, this.playerY - 40, '🛡️ SHIELD!', '#06b6d4');
          this.createExplosion(itemX, item.y, '#06b6d4', 14);
        } else if (item.type === 'MULTIPLIER') {
          this.powerUpState.multiplierTimer = 10;
          this.addFloatingText(this.playerX, this.playerY - 40, '⭐ 2X SCORE!', '#f59e0b');
          this.createExplosion(itemX, item.y, '#f59e0b', 14);
        }

        this.powerUps.splice(i, 1);
        continue;
      }

      if (item.y > this.height + 50) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  // --- Particles & Text ---
  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 1.2 * dt;
      t.life -= dt * 0.03;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- Game Over Trigger & Catch Sequence ---
  private triggerGameOver() {
    this.isGameOver = true;
    this.isMonsterCatching = true;
    this.monsterCatchProgress = 0;
    this.screenShake = 22;
    sound.playGameOver();
    this.createExplosion(this.playerX, this.playerY, '#ef4444', 24);
    this.saveHighScore();
  }

  private updateGameOverCatch(dt: number) {
    this.monsterCatchProgress += 0.05 * dt;

    // Monster leaps from behind onto the player!
    this.monsterY += (this.playerY - 20 - this.monsterY) * 0.25 * dt;
    this.monsterX += (this.playerX - this.monsterX) * 0.25 * dt;

    // Stop runner
    this.speed = Math.max(0, this.speed - 0.5 * dt);

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.6 * dt);
    }

    this.updateParticles(dt);

    if (this.monsterCatchProgress >= 1.4 && this.isRunning) {
      this.isRunning = false;
      if (this.onGameOver) {
        this.onGameOver({
          score: Math.floor(this.score),
          highScore: Math.floor(this.highScore),
          distance: Math.floor(this.distance),
          coins: this.coinsCount,
          speed: parseFloat(this.speed.toFixed(1)),
        });
      }
    }
  }

  // --- Visual Effects Generators ---
  private createLaneDust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 2,
        size: 3 + Math.random() * 4,
        color: '#94a3b8',
        alpha: 0.7,
        life: 0,
        maxLife: 16,
      });
    }
  }

  private createJumpDust(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 2,
        size: 4 + Math.random() * 5,
        color: '#cbd5e1',
        alpha: 0.8,
        life: 0,
        maxLife: 20,
      });
    }
  }

  private createCoinSparkles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2.5 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: '#fde047',
        alpha: 1,
        life: 0,
        maxLife: 18,
      });
    }
  }

  private createExplosion(x: number, y: number, color: string, count: number = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 6,
        color,
        alpha: 1,
        life: 0,
        maxLife: 25,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({ x, y, text, color, life: 1 });
  }

  // --- Rendering ---
  public render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Clear background & draw environmental night/dungeon road
    this.renderBackground(ctx);

    // 2. Draw Road & Lanes
    this.renderRoad(ctx);

    // 3. Draw Scenery (lamps, trees, side barriers)
    this.renderScenery(ctx);

    // 4. Draw Obstacles
    this.renderObstacles(ctx);

    // 5. Draw Coins & Power-ups
    this.renderCoinsAndPowerUps(ctx);

    // 6. Draw Monster (Behind player)
    this.renderMonster(ctx);

    // 7. Draw Player Character
    this.renderPlayer(ctx);

    // 8. Draw Particles & Floating Texts
    this.renderParticles(ctx);

    // 9. Speed Vignette & Arcade Lighting
    this.renderSpeedEffects(ctx);

    ctx.restore();
  }

  // Background with Parallax Scrolling & Speed Reaction
  private renderBackground(ctx: CanvasRenderingContext2D) {
    // 1. Deep Space & Sky Canvas Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.3, '#10172a');
    bgGrad.addColorStop(0.7, '#16213e');
    bgGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Parallax Twinkling Stars
    for (const star of this.stars) {
      ctx.save();
      const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.x) * 0.3 + 0.7;
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Glowing Cyber Moon in Upper Sky
    ctx.save();
    const moonX = this.width - 65;
    const moonY = 40;
    // Outer Neon Glow Ring
    ctx.shadowColor = '#4cc9f0';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4cc9f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Moon Crescent
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(moonX + 3, moonY - 3, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(moonX - 2, moonY - 5, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Parallax Distant Skyline Layer 1 (Slow Horizon Silhouette)
    ctx.save();
    const l1Offset = (this.cityOffset * 0.4) % 160;
    ctx.fillStyle = '#0f172a';
    for (let x = -160 + l1Offset; x < this.width + 160; x += 36) {
      const bHeight = 35 + ((Math.abs(x * 17)) % 40);
      ctx.fillRect(x, 100 - bHeight, 30, bHeight);

      // Flashing Rooftop Beacon
      if (Math.abs(x) % 72 < 36) {
        const isBeaconOn = Math.floor(Date.now() / 350) % 2 === 0;
        ctx.fillStyle = isBeaconOn ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(x + 13, 100 - bHeight - 4, 4, 4);
        ctx.fillStyle = '#0f172a';
      }
    }
    ctx.restore();

    // 5. Parallax Midground Skyline Layer 2 (Cyberpunk Neon Towers)
    ctx.save();
    const l2Offset = this.cityOffset % 180;
    for (let x = -180 + l2Offset; x < this.width + 180; x += 44) {
      const bHeight = 50 + ((Math.abs(x * 29)) % 48);
      ctx.fillStyle = '#16213e';
      ctx.fillRect(x, 102 - bHeight, 38, bHeight + 4);

      // Building Rooftop Edge Accent
      ctx.fillStyle = '#0f3460';
      ctx.fillRect(x, 102 - bHeight, 38, 3);

      // Windows with animated pulsing neon cyan/crimson
      for (let wy = 102 - bHeight + 10; wy < 95; wy += 12) {
        ctx.fillStyle = (Math.abs(x + wy) % 5 === 0) ? '#e94560' : (Math.abs(x + wy) % 3 === 0) ? '#4cc9f0' : '#334155';
        ctx.fillRect(x + 6, wy, 6, 6);
        ctx.fillRect(x + 16, wy, 6, 6);
        ctx.fillRect(x + 26, wy, 6, 6);
      }

      // Neon Rooftop Signs
      if (Math.abs(x) % 132 < 44) {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('⚡RUN', x + 4, 102 - bHeight - 2);
      }
    }
    ctx.restore();

    // 6. Side Cyber Grid (Moving Perspective Grid Stripes along road edges)
    ctx.save();
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.15)';
    ctx.lineWidth = 1.5;
    const gridOffset = (this.roadOffset * 1.5) % 40;
    for (let gy = 100 + gridOffset; gy < this.height; gy += 35) {
      // Left side perspective grid line
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(this.roadLeft * (gy / this.height), gy);
      ctx.stroke();

      // Right side perspective grid line
      ctx.beginPath();
      ctx.moveTo(this.width, gy);
      ctx.lineTo(this.width - (this.width - this.roadRight) * (gy / this.height), gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3-Lane Road
  private renderRoad(ctx: CanvasRenderingContext2D) {
    const roadTopWidth = 260;
    const roadTopLeft = (this.width - roadTopWidth) / 2;
    const roadBottomLeft = this.roadLeft;
    const roadBottomRight = this.roadRight;

    // Road asphalt with deep perspective gradient
    ctx.beginPath();
    ctx.moveTo(roadTopLeft, 90);
    ctx.lineTo(roadTopLeft + roadTopWidth, 90);
    ctx.lineTo(roadBottomRight, this.height);
    ctx.lineTo(roadBottomLeft, this.height);
    ctx.closePath();

    const roadGrad = ctx.createLinearGradient(0, 90, 0, this.height);
    roadGrad.addColorStop(0, '#101626');
    roadGrad.addColorStop(0.5, '#16213e');
    roadGrad.addColorStop(1, '#1e2946');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // Road Neon Glowing Borders in Crimson & Cyan with enhanced glow
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#e94560';
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 14;

    // Left border
    ctx.beginPath();
    ctx.moveTo(roadTopLeft, 90);
    ctx.lineTo(roadBottomLeft, this.height);
    ctx.stroke();

    // Right border
    ctx.beginPath();
    ctx.moveTo(roadTopLeft + roadTopWidth, 90);
    ctx.lineTo(roadBottomRight, this.height);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset shadow

    // Roadside Curb Reflectors (Alternating Cyan/Crimson light bars zooming down)
    ctx.save();
    const curbOffset = (this.roadOffset * 2) % 60;
    for (let cy = 100 + curbOffset; cy < this.height; cy += 45) {
      const progress = (cy - 90) / (this.height - 90);
      const leftCurbX = roadTopLeft + (roadBottomLeft - roadTopLeft) * progress;
      const rightCurbX = (roadTopLeft + roadTopWidth) + (roadBottomRight - (roadTopLeft + roadTopWidth)) * progress;

      ctx.fillStyle = (Math.floor(cy / 45) % 2 === 0) ? '#4cc9f0' : '#e94560';
      ctx.fillRect(leftCurbX - 4, cy, 4, 12);
      ctx.fillRect(rightCurbX, cy, 4, 12);
    }
    ctx.restore();

    // Lane Dividers (Dashed moving lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 20]);
    ctx.lineDashOffset = -this.roadOffset;

    // Divider 1 (between lane 0 and 1)
    const d1TopX = roadTopLeft + roadTopWidth * (1 / 3);
    const d1BottomX = roadBottomLeft + (roadBottomRight - roadBottomLeft) * (1 / 3);
    ctx.beginPath();
    ctx.moveTo(d1TopX, 90);
    ctx.lineTo(d1BottomX, this.height);
    ctx.stroke();

    // Divider 2 (between lane 1 and 2)
    const d2TopX = roadTopLeft + roadTopWidth * (2 / 3);
    const d2BottomX = roadBottomLeft + (roadBottomRight - roadBottomLeft) * (2 / 3);
    ctx.beginPath();
    ctx.moveTo(d2TopX, 90);
    ctx.lineTo(d2BottomX, this.height);
    ctx.stroke();

    ctx.setLineDash([]); // reset line dash

    // Moving Center Lane Speed Chevrons (>> >> >>) indicating speed flow
    ctx.save();
    ctx.fillStyle = 'rgba(76, 201, 240, 0.18)';
    const chevOffset = (this.roadOffset * 1.5) % 80;
    for (let chy = 120 + chevOffset; chy < this.height - 40; chy += 80) {
      const p = (chy - 90) / (this.height - 90);
      const cx = this.laneCenters[1] * (0.3 + 0.7 * p);
      ctx.beginPath();
      ctx.moveTo(cx - 14 * p, chy);
      ctx.lineTo(cx, chy + 12 * p);
      ctx.lineTo(cx + 14 * p, chy);
      ctx.lineTo(cx + 8 * p, chy - 4 * p);
      ctx.lineTo(cx, chy + 4 * p);
      ctx.lineTo(cx - 8 * p, chy - 4 * p);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Scenery Items (Street lights & roadside banners)
  private renderScenery(ctx: CanvasRenderingContext2D) {
    for (const item of this.sceneryItems) {
      const isLeft = item.side === 'left';
      const x = isLeft ? 35 : this.width - 35;
      const y = item.y;

      if (y < 80 || y > this.height) continue;

      if (item.type === 0) {
        // Neon Streetlight post
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x - 2, y - 25, 4, 30);
        // Glowing Lamp Bulb
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x + (isLeft ? 6 : -6), y - 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (item.type === 1) {
        // Neon Tech Pillar
        ctx.fillStyle = '#334155';
        ctx.fillRect(x - 6, y - 20, 12, 24);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(x - 4, y - 14, 8, 4);
      } else {
        // Roadside Tree / Bush
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.arc(x, y - 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y - 20, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Obstacles
  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      if (obs.y < 60 || obs.y > this.height + 40) continue;
      const x = this.laneCenters[obs.lane];
      const y = obs.y;

      // Obstacle Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x, y + obs.height / 2 - 2, obs.width / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (obs.type === 'ROCK') {
        // Stylized Boulder / Rock (Jumpable)
        ctx.save();
        ctx.translate(x, y);

        // Boulder base
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.moveTo(-24, 12);
        ctx.lineTo(-20, -14);
        ctx.lineTo(0, -22);
        ctx.lineTo(22, -12);
        ctx.lineTo(24, 12);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#a8a29e';
        ctx.beginPath();
        ctx.moveTo(-16, -10);
        ctx.lineTo(0, -18);
        ctx.lineTo(14, -8);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();

        // Rock cracks & moss
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(4, 6);
        ctx.stroke();

        // Jump hint badge for rocks
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ JUMP', 0, -26);

        ctx.restore();
      } else if (obs.type === 'BARRICADE') {
        // High Warning Barricade (Cannot jump over! Must switch lane!)
        ctx.save();
        ctx.translate(x, y);

        // Red/White striped barrier board
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-28, -26, 56, 32);

        // Diagonal white stripes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-20, -26);
        ctx.lineTo(-12, -26);
        ctx.lineTo(-24, 6);
        ctx.lineTo(-28, 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-4, -26);
        ctx.lineTo(4, -26);
        ctx.lineTo(-8, 6);
        ctx.lineTo(-16, 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12, -26);
        ctx.lineTo(20, -26);
        ctx.lineTo(8, 6);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(-24, 6, 6, 14);
        ctx.fillRect(18, 6, 6, 14);

        // Flashing Warning Siren Light
        const isBlink = Math.floor(Date.now() / 200) % 2 === 0;
        ctx.fillStyle = isBlink ? '#facc15' : '#e11d48';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -32, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Warning Label
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⛔ DODGE!', 0, -42);

        ctx.restore();
      } else {
        // SPIKES (Jumpable)
        ctx.save();
        ctx.translate(x, y);

        // Metal base
        ctx.fillStyle = '#475569';
        ctx.fillRect(-24, 0, 48, 8);

        // Spikes
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        for (let s = -20; s <= 20; s += 10) {
          ctx.moveTo(s - 4, 0);
          ctx.lineTo(s, -18);
          ctx.lineTo(s + 4, 0);
        }
        ctx.closePath();
        ctx.fill();

        // Warning badge
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ JUMP', 0, -22);

        ctx.restore();
      }
    }
  }

  // Coins and Power-ups
  private renderCoinsAndPowerUps(ctx: CanvasRenderingContext2D) {
    // Coins
    for (const coin of this.coins) {
      if (coin.y < 70 || coin.y > this.height + 20) continue;
      const x = this.laneCenters[coin.lane];
      const y = coin.y;

      const scaleX = Math.cos(coin.frame); // 3D Coin Rotation Effect

      ctx.save();
      ctx.translate(x, y);

      // Coin shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Coin Body
      ctx.scale(Math.abs(scaleX) < 0.1 ? 0.1 : scaleX, 1);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Star / Inset
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);

      ctx.restore();
    }

    // Power-up items
    for (const item of this.powerUps) {
      if (item.y < 70 || item.y > this.height + 20) continue;
      const x = this.laneCenters[item.lane];
      const y = item.y;

      ctx.save();
      ctx.translate(x, y);

      // Glowing Aura
      const floatY = Math.sin(Date.now() / 150) * 4;
      ctx.translate(0, floatY);

      ctx.shadowColor = item.type === 'MAGNET' ? '#ec4899' : item.type === 'SHIELD' ? '#06b6d4' : '#f59e0b';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = ctx.shadowColor;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Icon
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = item.type === 'MAGNET' ? '🧲' : item.type === 'SHIELD' ? '🛡️' : '⭐';
      ctx.fillText(icon, 0, 1);

      ctx.restore();
    }
  }

  // Monster Chaser (Lively, Ferocious Beast with Stomping Legs, Flapping Wings & Menacing Snapping Maw)
  private renderMonster(ctx: CanvasRenderingContext2D) {
    const x = this.monsterX;
    const y = this.monsterY;
    const bob = Math.sin(this.monsterFrame * 1.2) * 7;
    const stride = Math.sin(this.monsterFrame * 1.5);

    ctx.save();
    ctx.translate(x, y + bob);

    // 1. Dark Demonic Energy Aura & Ground Shadow
    ctx.save();
    ctx.shadowColor = '#991b1b';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 26 - bob, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Flapping Demon Shadow Wings / Tendrils on Sides
    ctx.save();
    const wingFlap = Math.sin(this.monsterFrame * 1.8) * 12;
    // Left Wing
    ctx.fillStyle = 'rgba(112, 26, 117, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.quadraticCurveTo(-55, -35 + wingFlap, -60, -15 + wingFlap);
    ctx.lineTo(-44, 0 + wingFlap * 0.5);
    ctx.quadraticCurveTo(-30, 10, -20, 4);
    ctx.closePath();
    ctx.fill();
    // Left Wing Bone Accent
    ctx.strokeStyle = '#a21caf';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(20, -10);
    ctx.quadraticCurveTo(55, -35 - wingFlap, 60, -15 - wingFlap);
    ctx.lineTo(44, 0 - wingFlap * 0.5);
    ctx.quadraticCurveTo(30, 10, 20, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Stomping Monster Beast Legs & Claws
    ctx.fillStyle = '#581c87';
    const legL = stride * 12;
    const legR = -stride * 12;
    // Left Leg
    ctx.beginPath();
    ctx.roundRect(-24, 6, 14, 22 + legL, 6);
    ctx.fill();
    // Left Foot Talons
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-28, 24 + legL, 6, 6);
    ctx.fillRect(-20, 24 + legL, 6, 6);
    ctx.fillRect(-12, 24 + legL, 6, 6);

    // Right Leg
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.roundRect(10, 6, 14, 22 + legR, 6);
    ctx.fill();
    // Right Foot Talons
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(8, 24 + legR, 6, 6);
    ctx.fillRect(16, 24 + legR, 6, 6);
    ctx.fillRect(24, 24 + legR, 6, 6);

    // 4. Undulating Jagged Dorsal Spikes on Back/Head
    ctx.fillStyle = '#e11d48';
    for (let s = -18; s <= 18; s += 9) {
      const spikeWiggle = Math.sin(this.monsterFrame * 2 + s) * 4;
      ctx.beginPath();
      ctx.moveTo(s - 3, -34);
      ctx.lineTo(s + spikeWiggle, -48 - Math.abs(s) * 0.3);
      ctx.lineTo(s + 3, -34);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Monster Big Muscular Furry Body
    ctx.fillStyle = '#701a75'; // Deep magenta / purple beast body
    ctx.beginPath();
    ctx.arc(0, -8, 36, 0, Math.PI * 2);
    ctx.fill();

    // Body Texture / Shadow Fur Trim
    ctx.fillStyle = '#86198f';
    ctx.beginPath();
    ctx.arc(0, -6, 28, 0, Math.PI * 2);
    ctx.fill();

    // 6. Demonic Golden Curved Horns with Glowing Etched Runes
    ctx.fillStyle = '#d97706';
    // Left Horn
    ctx.beginPath();
    ctx.moveTo(-18, -32);
    ctx.quadraticCurveTo(-36, -52, -28, -62);
    ctx.quadraticCurveTo(-14, -48, -10, -30);
    ctx.closePath();
    ctx.fill();
    // Right Horn
    ctx.beginPath();
    ctx.moveTo(18, -32);
    ctx.quadraticCurveTo(36, -52, 28, -62);
    ctx.quadraticCurveTo(14, -48, 10, -30);
    ctx.closePath();
    ctx.fill();

    // Horn Highlights
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-22, -48, 3, 6);
    ctx.fillRect(19, -48, 3, 6);

    // 7. Monster Glowing Eyes with Menacing Eye-Trails
    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(-13, -15, 9, 8, -0.15, 0, Math.PI * 2);
    ctx.ellipse(13, -15, 9, 8, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fierce Slit Pupils focused forward
    ctx.fillStyle = '#881337';
    const pupilY = this.isMonsterCatching ? -19 : -15;
    ctx.beginPath();
    ctx.ellipse(-12, pupilY, 3, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(14, pupilY, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrow Rims / Angry Glare
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -23);
    ctx.lineTo(-6, -17);
    ctx.moveTo(24, -23);
    ctx.lineTo(6, -17);
    ctx.stroke();

    // 8. Ferocious Snapping Maw / Mouth with sharp fangs & saliva embers
    const mouthOpen = this.isMonsterCatching ? 24 : 14 + Math.sin(this.monsterFrame * 1.5) * 5;
    ctx.fillStyle = '#1e1b4b'; // Deep dark inner throat
    ctx.beginPath();
    ctx.ellipse(0, 4, 20, mouthOpen, 0, 0, Math.PI);
    ctx.fill();

    // Glowing Magma Tongue
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.ellipse(0, 8 + mouthOpen * 0.3, 10, mouthOpen * 0.4, 0, 0, Math.PI);
    ctx.fill();

    // Razor Sharp White Fangs (Top & Bottom rows)
    ctx.fillStyle = '#ffffff';
    // Top Fangs
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-3, 14);
    ctx.lineTo(0, 4);
    ctx.lineTo(3, 14);
    ctx.lineTo(8, 4);
    ctx.lineTo(12, 12);
    ctx.lineTo(16, 4);
    ctx.closePath();
    ctx.fill();

    // Bottom Fangs
    ctx.beginPath();
    ctx.moveTo(-12, 4 + mouthOpen);
    ctx.lineTo(-8, -2 + mouthOpen);
    ctx.lineTo(-4, 4 + mouthOpen);
    ctx.lineTo(0, -4 + mouthOpen);
    ctx.lineTo(4, 4 + mouthOpen);
    ctx.lineTo(8, -2 + mouthOpen);
    ctx.lineTo(12, 4 + mouthOpen);
    ctx.closePath();
    ctx.fill();

    // 9. Claws Reaching Out (Animated claw swipes toward player)
    ctx.fillStyle = '#86198f';
    const handWaveL = Math.cos(this.monsterFrame * 1.6) * 10;
    const handWaveR = Math.sin(this.monsterFrame * 1.6) * 10;
    // Left Claw
    ctx.beginPath();
    ctx.arc(-36, -2 + handWaveL, 11, 0, Math.PI * 2);
    ctx.fill();
    // Right Claw
    ctx.beginPath();
    ctx.arc(36, -2 + handWaveR, 11, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sharp Claw Talons
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-42, -14 + handWaveL, 4, 8);
    ctx.fillRect(-38, -16 + handWaveL, 4, 9);
    ctx.fillRect(-34, -15 + handWaveL, 4, 8);

    ctx.fillRect(30, -15 + handWaveR, 4, 8);
    ctx.fillRect(34, -16 + handWaveR, 4, 9);
    ctx.fillRect(38, -14 + handWaveR, 4, 8);

    ctx.restore();
  }

  // Player Character (Cool Cyber Runner with Ghost Trails, Glowing Visor, Neon Sneakers & High-Tech Jacket)
  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const x = this.playerX;
    const groundY = this.playerY;
    const y = groundY - this.playerJumpY;
    const jumpOffset = this.playerJumpY;

    // 1. Render Ghost Motion Trails (Cool luminous silhouettes trailing behind)
    for (const trail of this.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = trail.alpha * 0.6;
      ctx.translate(trail.x, trail.y - trail.jumpY);
      ctx.fillStyle = trail.color;
      ctx.shadowColor = trail.color;
      ctx.shadowBlur = 10;
      // Silhouette body
      ctx.beginPath();
      ctx.roundRect(-14, -20, 28, 22, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -28, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();

    // 2. Ground Drop Shadow (Scales, diffuses and fades realistically with jump height)
    const shadowScale = Math.max(0.3, 1 - jumpOffset / 120);
    const shadowAlpha = Math.max(0.12, 0.45 - jumpOffset / 180);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 16, 24 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Power-Up Visual Forcefield Auras
    // Shield Aura
    if (this.powerUpState.shieldActive) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 120) * 3;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.arc(x, y - 10, 32 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shield Hexagon Matrix Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Magnet Aura
    if (this.powerUpState.magnetTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -Date.now() * 0.05;
      ctx.beginPath();
      ctx.arc(x, y - 10, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2X Score Multiplier Aura
    if (this.powerUpState.multiplierTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y - 10, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Hero Cyber Runner Body Rendering
    ctx.translate(x, y);

    // Dynamic Body Tilt when steering between lanes
    const steeringTilt = (this.playerTargetX - this.playerX) * 0.003;
    ctx.rotate(steeringTilt);

    // Running leg animation
    const legPhase = Math.sin(this.runFrame);
    const legL = this.isJumping ? 8 : legPhase * 11;
    const legR = this.isJumping ? -6 : -legPhase * 11;

    // Running Athletic Pants in Midnight Charcoal with Neon Knee Accents
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11, 0, 7, 13 + legL);
    ctx.fillRect(4, 0, 7, 13 + legR);

    // Knee LED status dots
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-9, 5 + legL * 0.5, 3, 3);
    ctx.fillRect(6, 5 + legR * 0.5, 3, 3);

    // High-Tech Cyber Sneakers with Glowing Energy Cushion Soles
    // Left Sneaker
    ctx.fillStyle = '#e11d48'; // Crimson shoe body
    ctx.fillRect(-13, 11 + legL, 11, 7);
    // Glowing Cyan Energy Sole
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(-14, 16 + legL, 13, 3);
    ctx.shadowBlur = 0;

    // Right Sneaker
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(4, 11 + legR, 11, 7);
    // Glowing Cyan Energy Sole
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(3, 16 + legR, 13, 3);
    ctx.shadowBlur = 0;

    // Skin Color Palettes
    let jacketColor = '#1e293b';
    let trimColor = '#38bdf8';
    let reactorColor = '#38bdf8';
    let scarfColor1 = '#f97316';
    let scarfColor2 = '#f43f5e';
    let shoeColor = '#e11d48';
    let visorColor = '#06b6d4';
    let visorGlow = '#38bdf8';
    let capBrimColor = '#e11d48';

    if (this.characterSkin === 'NEON_BLAZE') {
      jacketColor = '#7f1d1d';
      trimColor = '#fbbf24';
      reactorColor = '#ef4444';
      scarfColor1 = '#ef4444';
      scarfColor2 = '#fbbf24';
      shoeColor = '#f97316';
      visorColor = '#f97316';
      visorGlow = '#ef4444';
      capBrimColor = '#f97316';
    } else if (this.characterSkin === 'STEALTH_SHADOW') {
      jacketColor = '#09090b';
      trimColor = '#10b981';
      reactorColor = '#10b981';
      scarfColor1 = '#047857';
      scarfColor2 = '#059669';
      shoeColor = '#18181b';
      visorColor = '#10b981';
      visorGlow = '#34d399';
      capBrimColor = '#10b981';
    } else if (this.characterSkin === 'GOLDEN_CHAMPION') {
      jacketColor = '#451a03';
      trimColor = '#facc15';
      reactorColor = '#fbbf24';
      scarfColor1 = '#f59e0b';
      scarfColor2 = '#fbbf24';
      shoeColor = '#d97706';
      visorColor = '#facc15';
      visorGlow = '#eab308';
      capBrimColor = '#f59e0b';
    }

    // Sleek High-Tech Cyber Runner Jacket (Customizable by Skin)
    ctx.fillStyle = jacketColor;
    ctx.beginPath();
    ctx.roundRect(-15, -20, 30, 22, 6);
    ctx.fill();

    // Jacket Neon Trim Lines / Piping
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-13, -18);
    ctx.lineTo(-4, 0);
    ctx.moveTo(13, -18);
    ctx.lineTo(4, 0);
    ctx.stroke();

    // Chest Core Energy Arc Reactor / Runner Emblem
    ctx.fillStyle = reactorColor;
    ctx.shadowColor = reactorColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dual-Tail Aerodynamic Glowing Cyber-Scarf (Flows dynamically in the wind)
    const scarfWave1 = Math.sin(this.runFrame * 1.5) * 8;
    const scarfWave2 = Math.cos(this.runFrame * 1.5) * 8;
    // Tail 1
    ctx.fillStyle = scarfColor1;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.quadraticCurveTo(-22, -14 + scarfWave1, -30, -8 + scarfWave1);
    ctx.lineTo(-28, -2 + scarfWave1);
    ctx.lineTo(-8, -10);
    ctx.closePath();
    ctx.fill();

    // Tail 2
    ctx.fillStyle = scarfColor2;
    ctx.beginPath();
    ctx.moveTo(8, -16);
    ctx.quadraticCurveTo(20, -14 + scarfWave2, 28, -8 + scarfWave2);
    ctx.lineTo(26, -2 + scarfWave2);
    ctx.lineTo(6, -10);
    ctx.closePath();
    ctx.fill();

    // Head / Face
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(0, -28, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Runner Helmet / Cap
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-13, -39, 26, 9);
    // Neon Cap Visor Brim
    ctx.fillStyle = capBrimColor;
    ctx.fillRect(-15, -33, 30, 4);

    // Futuristic Holographic HUD Cyber-Visor across eyes
    ctx.save();
    ctx.fillStyle = visorColor;
    ctx.shadowColor = visorGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-10, -30, 20, 7, 3);
    ctx.fill();
    // Holographic Sweep Scanline
    const sweepX = Math.sin(Date.now() / 180) * 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sweepX - 1, -30, 2, 7);
    ctx.restore();

    // Cyber Headphones / Audio Tracker on sides of head
    ctx.fillStyle = '#334155';
    ctx.fillRect(-15, -31, 3, 7);
    ctx.fillRect(12, -31, 3, 7);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(-15, -29, 3, 3);
    ctx.fillRect(12, -29, 3, 3);

    // Arms in active runner pose with illuminated wristbands
    const armSwing = Math.cos(this.runFrame) * 9;
    // Left Arm
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-17, -14 + armSwing, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-19, -15 + armSwing, 4, 2);

    // Right Arm
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(17, -14 - armSwing, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(15, -15 - armSwing, 4, 2);

    ctx.restore();
  }

  // Particles & Floating Text
  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  // Speed effects (Speed lines & wind streaks reacting to game speed)
  private renderSpeedEffects(ctx: CanvasRenderingContext2D) {
    if (this.speed > 7) {
      const lineCount = Math.floor(this.speed * 1.5);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.8;

      for (let i = 0; i < lineCount; i++) {
        const isLeft = i % 2 === 0;
        const x = (isLeft ? 24 : this.width - 24) + (Math.random() - 0.5) * 35;
        const y = Math.random() * this.height;
        const len = 35 + (this.speed * 4) + Math.random() * 40;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + len);
        ctx.stroke();
      }

      // Neon speed particles streaming down sides
      for (let i = 0; i < 4; i++) {
        const px = (i % 2 === 0 ? 15 : this.width - 15) + (Math.random() - 0.5) * 20;
        const py = Math.random() * this.height;
        ctx.fillStyle = i % 2 === 0 ? '#4cc9f0' : '#e94560';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(px, py, 2, 14);
      }
      ctx.restore();
    }
  }
}
