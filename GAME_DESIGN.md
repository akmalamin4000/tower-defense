# Tower Defense Game — Design Document

> **Status:** Phase 1–6 Complete (Playable)  
> **Tech Stack:** Vanilla JavaScript + HTML Canvas  
> **Target Playtime:** ~30 minutes  
> **Deployment:** Vercel (Static Site)  
> **Last Updated:** February 19, 2026

---

## Table of Contents

1. [Game Overview](#game-overview)
2. [Core Mechanics](#core-mechanics)
3. [Towers](#towers)
4. [Enemies](#enemies)
5. [Waves & Progression](#waves--progression)
6. [Economy](#economy)
7. [Map Design](#map-design)
8. [UI / HUD](#ui--hud)
9. [Visual Style](#visual-style)
10. [Audio](#audio)
11. [Technical Architecture](#technical-architecture)
12. [File Structure](#file-structure)
13. [Development Roadmap](#development-roadmap)
14. [Changelog](#changelog)

---

## Game Overview

A classic 2D tower defense game where players strategically place towers along a path to prevent waves of enemies from reaching their base. The game features **30 waves** of increasing difficulty, unlockable tower types, and an upgrade system — designed to be completed in roughly 30 minutes.

**Win Condition:** Survive all 30 waves.  
**Lose Condition:** Enemy units deplete the player's health (lives) to 0.

---

## Core Mechanics

| Mechanic | Description |
|---|---|
| **Placement** | Players place towers on valid grid cells (not on the path or obstacles) |
| **Targeting** | Towers auto-target enemies within their range (priority: first/closest/strongest — configurable per tower) |
| **Waves** | Enemies spawn in waves with short breaks between them; player can fast-forward or start next wave early for a gold bonus |
| **Upgrading** | Each tower has 3 upgrade levels, improving damage, range, and/or fire rate |
| **Selling** | Players can sell towers for 60% of total invested gold |
| **Speed Control** | Normal (1x) and Fast (2x) speed toggle |

---

## Towers

### Tower Types (Unlocked Progressively)

| # | Tower | Unlock | Cost | Damage | Range | Fire Rate | Special |
|---|---|---|---|---|---|---|---|
| 1 | **Arrow Tower** | Wave 1 | 50g | 10 | Medium | Fast | — |
| 2 | **Cannon Tower** | Wave 1 | 100g | 40 | Short | Slow | Splash damage (small AoE) |
| 3 | **Ice Tower** | Wave 5 | 75g | 5 | Medium | Medium | Slows enemies by 40% for 2s |
| 4 | **Sniper Tower** | Wave 10 | 150g | 100 | Very Long | Very Slow | Pierces armor |
| 5 | **Lightning Tower** | Wave 18 | 200g | 30 | Medium | Medium | Chains to 3 nearby enemies |
| 6 | **Flame Tower** | Wave 25 | 250g | 15/tick | Short | Continuous | Burns enemies (DoT for 3s) |

### Upgrade Levels

Each tower has **3 levels**. Upgrading costs 50% of the tower's base cost per level.

| Level | Damage Boost | Range Boost | Fire Rate Boost |
|---|---|---|---|
| 1 (Base) | — | — | — |
| 2 | +40% | +10% | +15% |
| 3 | +80% | +20% | +30% |

---

## Enemies

### Enemy Types

| # | Enemy | First Appears | HP | Speed | Armor | Special |
|---|---|---|---|---|---|---|
| 1 | **Scout** | Wave 1 | 30 | Fast | 0 | — |
| 2 | **Soldier** | Wave 3 | 80 | Medium | 1 | — |
| 3 | **Tank** | Wave 7 | 250 | Slow | 3 | — |
| 4 | **Runner** | Wave 10 | 40 | Very Fast | 0 | Hard to target |
| 5 | **Healer** | Wave 14 | 60 | Medium | 0 | Heals nearby enemies |
| 6 | **Shield Bearer** | Wave 18 | 150 | Slow | 5 | Reduces damage to nearby enemies |
| 7 | **Boss** | Wave 10, 20, 30 | 1000+ | Slow | 4 | Unique abilities per boss |

### Armor System

`Effective Damage = max(1, Damage - Armor)`  
Sniper Tower ignores armor completely.

---

## Waves & Progression

- **Total Waves:** 30
- **Wave Duration:** ~30–60 seconds each
- **Break Between Waves:** 10 seconds (skippable for +10g bonus)
- **Pacing:**
  - **Waves 1–5:** Tutorial / easy — introduces basic enemies, Arrow + Cannon towers
  - **Waves 6–10:** Ramp up — introduces Ice Tower, Runners, first Boss
  - **Waves 11–17:** Mid-game — mixed enemy types, Sniper introduction, Healers
  - **Waves 18–24:** Hard — Shield Bearers, Lightning Tower, enemy density increases
  - **Waves 25–30:** Endgame — all enemy types, Flame Tower, final Boss

### Boss Waves

| Wave | Boss | HP | Special Ability |
|---|---|---|---|
| 10 | **Iron Golem** | 1,500 | High armor (6), slow but tanky |
| 20 | **Shadow Lord** | 3,000 | Periodically goes invisible (untargetable for 2s) |
| 30 | **Dragon King** | 6,000 | Flies (ignores some towers), AoE fire on towers |

---

## Economy

| Source | Amount |
|---|---|
| Starting Gold | 200g |
| Kill: Scout | 5g |
| Kill: Soldier | 10g |
| Kill: Tank | 25g |
| Kill: Runner | 8g |
| Kill: Healer | 15g |
| Kill: Shield Bearer | 20g |
| Kill: Boss | 100g |
| Wave Completion Bonus | 20g + (wave_number × 5g) |
| Early Start Bonus | 10g |
| Selling Tower | 60% of total invested |

---

## Map Design

- **Grid Size:** 20 columns × 14 rows (each cell = 40×40 pixels → 800×560 play area)
- **Canvas Size:** 800×640 (extra 80px at bottom for HUD bar)
- **Path:** Pre-defined winding path from entry point (left side) to base (right side)
- **Terrain:**
  - 🟩 Grass — buildable
  - 🟫 Path — enemy route, not buildable
  - 🏠 Base — player's base (right side)
  - 🚪 Spawn — enemy entry (left side)

### Map 1 Layout (ASCII Preview)

```
S = Spawn, B = Base, . = Grass, # = Path

. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
S # # # # # . . . . . . . # # # # # . .
. . . . . # . . . . . . . # . . . . . .
. . . . . # . . . . . . . # . . . . . .
. . . . . # # # # # # # # # . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
. . . . . # # # # # # # # # . . . . . .
. . . . . # . . . . . . . # . . . . . .
. . . . . # . . . . . . . # . . . . . .
. . # # # # . . . . . . . # # # # # # B
. . . . . . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . . . . . .
```

---

## UI / HUD

### Top Bar
- ❤️ Lives: `20 / 20`
- 💰 Gold: `200`
- 🌊 Wave: `1 / 30`
- ⏩ Speed Toggle (1x / 2x)
- ⏸️ Pause Button

### Bottom Panel (Tower Selection)
- Tower icons with names + cost
- Locked towers shown as grayed out with unlock wave number
- Selected tower highlighted

### Tower Info Panel (on click)
- Tower name + level
- Stats: Damage / Range / Fire Rate
- Upgrade button + cost
- Sell button + refund amount
- Target priority dropdown

### Game State Screens
- **Start Screen:** Title, "Play" button, brief instructions
- **Wave Banner:** "Wave X" notification at wave start
- **Win Screen:** Victory message, stats summary
- **Lose Screen:** Defeat message, retry button

---

## Visual Style

- **Art Style:** Clean geometric/minimalist shapes (circles, squares, triangles)
- **Color Palette:**
  - Background/Grass: `#4a8c3f`
  - Path: `#c4a567`
  - Towers: Distinct colors per type (blue, red, cyan, purple, yellow, orange)
  - Enemies: Dark tones (grays, blacks, dark red for bosses)
  - Projectiles: Bright, small, fast-moving
  - UI: Dark semi-transparent panels with white text
- **Effects:**
  - Range circle shown on hover/selection
  - Hit flash on enemies
  - Death particle burst
  - Slow effect visual (blue tint on enemy)
  - Burn effect visual (orange flicker)

---

## Audio

> **Phase 1:** No audio (silent)  
> **Phase 2 (Optional):** Add simple SFX using Web Audio API
- Tower shoot sounds
- Enemy death
- Wave start horn
- Boss warning
- Win/Lose jingles

---

## Technical Architecture

### Game Loop
```
requestAnimationFrame → update(deltaTime) → render(ctx)
```

### Core Modules

| Module | Responsibility |
|---|---|
| `main.js` | Entry point, canvas setup, game loop |
| `game.js` | Game state management, wave logic, win/lose conditions |
| `tower.js` | Tower classes, targeting, shooting, upgrades |
| `enemy.js` | Enemy classes, pathfinding, movement, abilities |
| `projectile.js` | Projectile movement, hit detection, effects |
| `map.js` | Grid, path data, tile rendering |
| `ui.js` | HUD, menus, tower selection panel, info panels |
| `effects.js` | Particle effects, damage numbers, visual feedback |
| `config.js` | All balance constants (tower stats, enemy stats, wave data) |
| `utils.js` | Math helpers, collision detection, distance calculations |

### State Machine
```
MENU → PLAYING → (PAUSED) → WIN / LOSE
                    ↑____↓
```

---

## File Structure

```
vercel_game/
├── index.html          # Single HTML entry point
├── css/
│   └── style.css       # Minimal styling for canvas centering + UI overlays
├── js/
│   ├── main.js         # Entry point, canvas, game loop
│   ├── game.js         # Game state, wave management
│   ├── config.js       # All game balance data
│   ├── map.js          # Grid & path
│   ├── tower.js        # Tower logic
│   ├── enemy.js        # Enemy logic
│   ├── projectile.js   # Projectile logic
│   ├── ui.js           # UI rendering & interaction
│   ├── effects.js      # Particles & visual effects
│   └── utils.js        # Helper functions
├── GAME_DESIGN.md      # This file
├── package.json        # For Vercel deployment
└── vercel.json         # Vercel config (optional)
```

---

## Development Roadmap

### Phase 1 — Core Foundation ✅
- [x] Project setup (HTML + Canvas + basic CSS)
- [x] Game loop with delta time
- [x] Grid rendering and map layout
- [x] Path definition and rendering

### Phase 2 — Enemies ✅
- [x] Basic enemy class with movement along path
- [x] Health bars above enemies
- [x] Enemy spawning system (wave-based)
- [x] Multiple enemy types with different stats

### Phase 3 — Towers ✅
- [x] Tower placement on grid (click to place)
- [x] Tower rendering with range visualization
- [x] Arrow Tower with basic targeting & shooting
- [x] Projectile system
- [x] Cannon Tower (splash damage)
- [x] Ice Tower (slow effect)

### Phase 4 — Economy & Upgrades ✅
- [x] Gold system (earn on kill, spend on towers)
- [x] Tower upgrade system (3 levels)
- [x] Tower selling
- [x] Wave completion bonuses

### Phase 5 — UI & Menus ✅
- [x] HUD (lives, gold, wave counter)
- [x] Tower selection panel
- [x] Tower info panel (upgrade/sell)
- [x] Start screen
- [x] Win/Lose screens
- [x] Wave banner notification

### Phase 6 — Advanced Towers & Enemies ✅
- [x] Sniper Tower
- [x] Lightning Tower (chain)
- [x] Flame Tower (DoT)
- [x] Healer enemy
- [x] Shield Bearer enemy
- [x] Boss enemies (Waves 10, 20, 30)

### Phase 7 — Polish ✅
- [x] Particle effects (death, hit)
- [x] Speed toggle (1x / 2x)
- [x] Pause functionality
- [x] Target priority options
- [x] Balance tuning
- [x] Early wave start bonus

### Phase 8 — Deployment ⬜
- [ ] Vercel deployment config
- [ ] Testing & bug fixes
- [ ] Final balance pass

---

## Changelog

| Date | Changes |
|---|---|
| 2026-02-19 | Initial game design document created |
| 2026-02-19 | Phase 1–7 implemented: full playable game with all towers, enemies, waves, UI, effects |
