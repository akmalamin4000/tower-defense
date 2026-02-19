// ============================================================
// game.js — Game state management, wave logic, win/lose
// ============================================================

const Game = {
    // State: 'menu', 'playing', 'paused', 'win', 'lose'
    state: 'menu',

    // Player resources
    lives: CONFIG.STARTING_LIVES,
    gold: CONFIG.STARTING_GOLD,

    // Wave management
    currentWave: 0,
    waveActive: false,
    waveBreakTimer: 0,
    waveBannerTimer: 0,

    // Spawn queue
    spawnQueue: [], // { type, delay } items waiting to spawn
    spawnTimer: 0,

    // Game objects
    enemies: [],
    towers: [],
    projectiles: [],

    // Speed
    gameSpeed: CONFIG.SPEED_NORMAL,

    /**
     * Initialize / reset the game
     */
    init() {
        this.state = 'menu';
        this.lives = CONFIG.STARTING_LIVES;
        this.gold = CONFIG.STARTING_GOLD;
        this.currentWave = 0;
        this.waveActive = false;
        this.waveBreakTimer = 0;
        this.waveBannerTimer = 0;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.gameSpeed = CONFIG.SPEED_NORMAL;

        GameMap.init();
        UI.init();
        UI.selectedTower = null;
        UI.selectedTowerType = null;
        Effects.clear();
    },

    /**
     * Start the game (from menu)
     */
    startGame() {
        this.state = 'playing';
        this.waveBreakTimer = CONFIG.WAVE_BREAK_TIME;
    },

    /**
     * Start the next wave
     */
    startNextWave() {
        if (this.currentWave >= CONFIG.TOTAL_WAVES) return;

        // Early start bonus
        if (this.waveBreakTimer > 0) {
            this.gold += CONFIG.EARLY_START_BONUS;
        }

        this.currentWave++;
        this.waveActive = true;
        this.waveBannerTimer = 2.0;

        // Build spawn queue from wave data
        const waveIdx = this.currentWave - 1;
        if (waveIdx < WAVE_DATA.length) {
            this.spawnQueue = [];
            const groups = WAVE_DATA[waveIdx];

            // Interleave spawn groups
            for (const group of groups) {
                for (let i = 0; i < group.count; i++) {
                    this.spawnQueue.push({
                        type: group.type,
                        delay: group.interval,
                    });
                }
            }

            // Shuffle spawn order slightly for variety (keep bosses at end)
            const bosses = this.spawnQueue.filter(s => ENEMY_TYPES[s.type].isBoss);
            const regular = this.spawnQueue.filter(s => !ENEMY_TYPES[s.type].isBoss);

            // Simple interleave of regular enemies
            for (let i = regular.length - 1; i > 0; i--) {
                const j = Math.max(0, i - Utils.randInt(0, 3));
                [regular[i], regular[j]] = [regular[j], regular[i]];
            }

            this.spawnQueue = [...regular, ...bosses];
            this.spawnTimer = 0.5; // small initial delay
        }
    },

    /**
     * Main update loop
     */
    update(dt) {
        if (this.state !== 'playing') return;

        const scaledDt = dt * this.gameSpeed;

        // Wave banner
        if (this.waveBannerTimer > 0) {
            this.waveBannerTimer -= scaledDt;
        }

        // Wave break timer
        if (!this.waveActive && this.currentWave < CONFIG.TOTAL_WAVES) {
            this.waveBreakTimer -= scaledDt;
            if (this.waveBreakTimer <= 0) {
                this.startNextWave();
            }
        }

        // Spawn enemies
        if (this.waveActive && this.spawnQueue.length > 0) {
            this.spawnTimer -= scaledDt;
            if (this.spawnTimer <= 0) {
                const spawn = this.spawnQueue.shift();
                const enemy = new Enemy(spawn.type, this.currentWave);
                this.enemies.push(enemy);
                this.spawnTimer = spawn.delay;
            }
        }

        // Reset shield status for all enemies
        for (const enemy of this.enemies) {
            if (enemy.alive) enemy.shielded = false;
        }

        // Apply shield bearer effect
        for (const enemy of this.enemies) {
            if (!enemy.alive || enemy.special !== 'shield') continue;
            for (const other of this.enemies) {
                if (other === enemy || !other.alive) continue;
                const dist = Utils.distance(enemy.x, enemy.y, other.x, other.y);
                if (dist <= enemy.shieldRange) {
                    other.shielded = true;
                }
            }
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(scaledDt, this.enemies);
        }

        // Check enemies that reached end + collect gold from dead
        for (const enemy of this.enemies) {
            if (!enemy.alive && enemy.reachedEnd && !enemy.penalized) {
                this.lives -= (enemy.isBoss ? 5 : 1);
                enemy.penalized = true;
            }
            if (!enemy.alive && !enemy.reachedEnd && !enemy.rewarded) {
                this.gold += enemy.reward;
                enemy.rewarded = true;
            }
        }

        // Remove dead/finished enemies
        this.enemies = this.enemies.filter(e => e.alive);

        // Update towers
        for (const tower of this.towers) {
            const newProjectiles = tower.update(scaledDt, this.enemies);
            this.projectiles.push(...newProjectiles);
        }

        // Update projectiles
        for (const proj of this.projectiles) {
            proj.update(scaledDt, this.enemies);
        }
        this.projectiles = this.projectiles.filter(p => p.alive);

        // Update effects
        Effects.update(scaledDt);

        // Check wave complete
        if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
            this.waveActive = false;

            // Wave completion bonus
            this.gold += CONFIG.WAVE_BONUS_BASE + this.currentWave * CONFIG.WAVE_BONUS_PER_WAVE;

            // Check win condition
            if (this.currentWave >= CONFIG.TOTAL_WAVES) {
                this.state = 'win';
            } else {
                this.waveBreakTimer = CONFIG.WAVE_BREAK_TIME;
            }
        }

        // Check lose condition
        if (this.lives <= 0) {
            this.lives = 0;
            this.state = 'lose';
        }
    },

    /**
     * Render everything
     */
    render(ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (this.state === 'menu') {
            UI.renderStartScreen(ctx);
            return;
        }

        // Game world
        GameMap.render(ctx);

        // Grid overlay when placing
        if (UI.selectedTowerType) {
            GameMap.renderGrid(ctx);
        }

        // Towers
        for (const tower of this.towers) {
            tower.render(ctx, tower === UI.selectedTower);
        }

        // Enemies
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }

        // Projectiles
        for (const proj of this.projectiles) {
            proj.render(ctx);
        }

        // Effects
        Effects.render(ctx);

        // UI
        UI.render(ctx, this);

        // Overlays
        if (this.state === 'paused') {
            UI.renderPauseOverlay(ctx);
        } else if (this.state === 'win') {
            UI.renderWinScreen(ctx, this);
        } else if (this.state === 'lose') {
            UI.renderLoseScreen(ctx, this);
        }
    },
};
