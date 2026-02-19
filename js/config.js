// ============================================================
// config.js — All game balance data & constants
// ============================================================

const CONFIG = {
    // Canvas / Grid
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 640,
    GRID_COLS: 20,
    GRID_ROWS: 14,
    CELL_SIZE: 40,
    HUD_HEIGHT: 80, // bottom 80px for HUD

    // Player
    STARTING_LIVES: 20,
    STARTING_GOLD: 200,

    // Economy
    SELL_REFUND_RATIO: 0.6,
    WAVE_BONUS_BASE: 20,
    WAVE_BONUS_PER_WAVE: 5,
    EARLY_START_BONUS: 10,
    WAVE_BREAK_TIME: 10, // seconds between waves

    // Speed
    SPEED_NORMAL: 1,
    SPEED_FAST: 2,

    // Total Waves
    TOTAL_WAVES: 30,
};

// ---- Tower Definitions ----
const TOWER_TYPES = {
    ARROW: {
        name: 'Arrow Tower',
        key: 'ARROW',
        cost: 50,
        damage: 10,
        range: 120, // pixels
        fireRate: 0.8, // seconds between shots
        color: '#4fc3f7',
        unlockWave: 1,
        projectileSpeed: 400,
        projectileColor: '#4fc3f7',
        projectileSize: 3,
        splash: 0,
        special: null,
        description: 'Fast, cheap, reliable.',
    },
    CANNON: {
        name: 'Cannon Tower',
        key: 'CANNON',
        cost: 100,
        damage: 40,
        range: 100,
        fireRate: 1.8,
        color: '#ef5350',
        unlockWave: 1,
        projectileSpeed: 250,
        projectileColor: '#ef5350',
        projectileSize: 5,
        splash: 50, // splash radius in pixels
        special: 'splash',
        description: 'Slow but deals AoE splash.',
    },
    ICE: {
        name: 'Ice Tower',
        key: 'ICE',
        cost: 75,
        damage: 5,
        range: 120,
        fireRate: 1.2,
        color: '#81d4fa',
        unlockWave: 5,
        projectileSpeed: 350,
        projectileColor: '#81d4fa',
        projectileSize: 4,
        splash: 0,
        special: 'slow',
        slowAmount: 0.4, // 40% slow
        slowDuration: 2, // seconds
        description: 'Slows enemies by 40% for 2s.',
    },
    SNIPER: {
        name: 'Sniper Tower',
        key: 'SNIPER',
        cost: 150,
        damage: 100,
        range: 250,
        fireRate: 3.0,
        color: '#ab47bc',
        unlockWave: 10,
        projectileSpeed: 800,
        projectileColor: '#ce93d8',
        projectileSize: 3,
        splash: 0,
        special: 'pierce_armor',
        description: 'Long range, ignores armor.',
    },
    LIGHTNING: {
        name: 'Lightning Tower',
        key: 'LIGHTNING',
        cost: 200,
        damage: 30,
        range: 130,
        fireRate: 1.5,
        color: '#ffd54f',
        unlockWave: 18,
        projectileSpeed: 0, // instant
        projectileColor: '#fff176',
        projectileSize: 0,
        splash: 0,
        special: 'chain',
        chainCount: 3,
        chainRange: 80,
        description: 'Chains lightning to 3 enemies.',
    },
    FLAME: {
        name: 'Flame Tower',
        key: 'FLAME',
        cost: 250,
        damage: 15, // per tick
        range: 90,
        fireRate: 0.3, // fast ticks
        color: '#ff7043',
        unlockWave: 25,
        projectileSpeed: 0, // area effect
        projectileColor: '#ff8a65',
        projectileSize: 0,
        splash: 0,
        special: 'burn',
        burnDamage: 5, // per second
        burnDuration: 3,
        description: 'Burns enemies over time.',
    },
};

// Upgrade multipliers per level (index 0 = level 1 base, 1 = level 2, 2 = level 3)
const UPGRADE_LEVELS = {
    costMultiplier: [0, 0.5, 0.5], // cost to upgrade = base_cost * multiplier
    damageMultiplier: [1.0, 1.4, 1.8],
    rangeMultiplier: [1.0, 1.1, 1.2],
    fireRateMultiplier: [1.0, 0.85, 0.70], // lower = faster
};

// ---- Enemy Definitions ----
const ENEMY_TYPES = {
    SCOUT: {
        name: 'Scout',
        hp: 30,
        speed: 80, // pixels per second
        armor: 0,
        reward: 5,
        color: '#90a4ae',
        size: 8,
        special: null,
    },
    SOLDIER: {
        name: 'Soldier',
        hp: 80,
        speed: 55,
        armor: 1,
        reward: 10,
        color: '#78909c',
        size: 10,
        special: null,
    },
    TANK: {
        name: 'Tank',
        hp: 250,
        speed: 35,
        armor: 3,
        reward: 25,
        color: '#546e7a',
        size: 14,
        special: null,
    },
    RUNNER: {
        name: 'Runner',
        hp: 40,
        speed: 120,
        armor: 0,
        reward: 8,
        color: '#a5d6a7',
        size: 7,
        special: null,
    },
    HEALER: {
        name: 'Healer',
        hp: 60,
        speed: 55,
        armor: 0,
        reward: 15,
        color: '#66bb6a',
        size: 10,
        special: 'heal',
        healAmount: 5, // HP per second to nearby allies
        healRange: 60,
    },
    SHIELD_BEARER: {
        name: 'Shield Bearer',
        hp: 150,
        speed: 40,
        armor: 5,
        reward: 20,
        color: '#5c6bc0',
        size: 13,
        special: 'shield',
        shieldRange: 60,
        shieldReduction: 0.3, // 30% damage reduction to nearby
    },
    // Bosses
    IRON_GOLEM: {
        name: 'Iron Golem',
        hp: 1500,
        speed: 25,
        armor: 6,
        reward: 100,
        color: '#d32f2f',
        size: 20,
        special: null,
        isBoss: true,
    },
    SHADOW_LORD: {
        name: 'Shadow Lord',
        hp: 3000,
        speed: 35,
        armor: 3,
        reward: 100,
        color: '#4a148c',
        size: 20,
        special: 'invisible',
        invisInterval: 8, // goes invis every 8s
        invisDuration: 2,
        isBoss: true,
    },
    DRAGON_KING: {
        name: 'Dragon King',
        hp: 6000,
        speed: 30,
        armor: 4,
        reward: 100,
        color: '#ff6f00',
        size: 22,
        special: 'flying',
        isBoss: true,
    },
};

// ---- Wave Definitions ----
// Each wave: array of { type, count, interval (seconds between spawns) }
const WAVE_DATA = [
    // Wave 1
    [{ type: 'SCOUT', count: 8, interval: 0.8 }],
    // Wave 2
    [{ type: 'SCOUT', count: 12, interval: 0.7 }],
    // Wave 3
    [{ type: 'SCOUT', count: 6, interval: 0.8 }, { type: 'SOLDIER', count: 4, interval: 1.2 }],
    // Wave 4
    [{ type: 'SOLDIER', count: 8, interval: 1.0 }],
    // Wave 5
    [{ type: 'SCOUT', count: 10, interval: 0.5 }, { type: 'SOLDIER', count: 6, interval: 1.0 }],
    // Wave 6
    [{ type: 'SOLDIER', count: 10, interval: 0.9 }],
    // Wave 7
    [{ type: 'SOLDIER', count: 6, interval: 1.0 }, { type: 'TANK', count: 3, interval: 2.0 }],
    // Wave 8
    [{ type: 'SCOUT', count: 15, interval: 0.4 }, { type: 'TANK', count: 4, interval: 2.0 }],
    // Wave 9
    [{ type: 'SOLDIER', count: 10, interval: 0.8 }, { type: 'TANK', count: 5, interval: 1.8 }],
    // Wave 10 — BOSS: Iron Golem
    [{ type: 'SOLDIER', count: 8, interval: 0.8 }, { type: 'IRON_GOLEM', count: 1, interval: 0 }],
    // Wave 11
    [{ type: 'RUNNER', count: 15, interval: 0.4 }],
    // Wave 12
    [{ type: 'RUNNER', count: 10, interval: 0.5 }, { type: 'SOLDIER', count: 8, interval: 0.9 }],
    // Wave 13
    [{ type: 'TANK', count: 8, interval: 1.5 }, { type: 'RUNNER', count: 8, interval: 0.5 }],
    // Wave 14
    [{ type: 'SOLDIER', count: 8, interval: 0.8 }, { type: 'HEALER', count: 3, interval: 2.5 }],
    // Wave 15
    [{ type: 'TANK', count: 6, interval: 1.5 }, { type: 'HEALER', count: 4, interval: 2.0 }],
    // Wave 16
    [{ type: 'RUNNER', count: 20, interval: 0.3 }, { type: 'SOLDIER', count: 5, interval: 1.0 }],
    // Wave 17
    [{ type: 'TANK', count: 8, interval: 1.2 }, { type: 'HEALER', count: 5, interval: 2.0 }],
    // Wave 18
    [{ type: 'SOLDIER', count: 10, interval: 0.7 }, { type: 'SHIELD_BEARER', count: 3, interval: 3.0 }],
    // Wave 19
    [{ type: 'TANK', count: 6, interval: 1.5 }, { type: 'SHIELD_BEARER', count: 4, interval: 2.5 }, { type: 'HEALER', count: 3, interval: 2.5 }],
    // Wave 20 — BOSS: Shadow Lord
    [{ type: 'SHIELD_BEARER', count: 4, interval: 2.0 }, { type: 'SHADOW_LORD', count: 1, interval: 0 }],
    // Wave 21
    [{ type: 'RUNNER', count: 25, interval: 0.25 }],
    // Wave 22
    [{ type: 'TANK', count: 10, interval: 1.0 }, { type: 'HEALER', count: 5, interval: 1.5 }],
    // Wave 23
    [{ type: 'SHIELD_BEARER', count: 6, interval: 2.0 }, { type: 'SOLDIER', count: 15, interval: 0.5 }],
    // Wave 24
    [{ type: 'TANK', count: 8, interval: 1.2 }, { type: 'SHIELD_BEARER', count: 5, interval: 2.0 }, { type: 'HEALER', count: 5, interval: 2.0 }],
    // Wave 25
    [{ type: 'RUNNER', count: 20, interval: 0.3 }, { type: 'TANK', count: 10, interval: 1.0 }],
    // Wave 26
    [{ type: 'SHIELD_BEARER', count: 8, interval: 1.5 }, { type: 'HEALER', count: 6, interval: 1.5 }],
    // Wave 27
    [{ type: 'TANK', count: 12, interval: 0.8 }, { type: 'RUNNER', count: 15, interval: 0.3 }],
    // Wave 28
    [{ type: 'SHIELD_BEARER', count: 8, interval: 1.2 }, { type: 'TANK', count: 8, interval: 1.0 }, { type: 'HEALER', count: 6, interval: 1.5 }],
    // Wave 29
    [{ type: 'RUNNER', count: 30, interval: 0.2 }, { type: 'TANK', count: 10, interval: 0.8 }, { type: 'SHIELD_BEARER', count: 5, interval: 2.0 }],
    // Wave 30 — BOSS: Dragon King
    [{ type: 'TANK', count: 6, interval: 1.5 }, { type: 'SHIELD_BEARER', count: 4, interval: 2.0 }, { type: 'HEALER', count: 4, interval: 2.0 }, { type: 'DRAGON_KING', count: 1, interval: 0 }],
];

// Target priority options
const TARGET_PRIORITIES = ['first', 'closest', 'strongest', 'weakest'];
