// ============================================================
// ui.js — HUD, menus, tower selection panel, info panels
// ============================================================

const UI = {
    selectedTowerType: null, // tower type key to place
    selectedTower: null,     // placed tower instance (for info panel)
    hoveredCell: null,       // { col, row }

    // Button regions (computed once)
    towerButtons: [],
    upgradeBtn: null,
    sellBtn: null,
    startWaveBtn: null,
    speedBtn: null,
    pauseBtn: null,
    priorityBtn: null,

    /**
     * Initialize UI — compute button positions
     */
    init() {
        this.computeTowerButtons();
    },

    computeTowerButtons() {
        this.towerButtons = [];
        const types = Object.keys(TOWER_TYPES);
        const startX = 10;
        const y = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE + 8;
        const btnW = 90;
        const btnH = 60;
        const gap = 6;

        types.forEach((key, i) => {
            this.towerButtons.push({
                key,
                x: startX + i * (btnW + gap),
                y,
                w: btnW,
                h: btnH,
            });
        });

        // Start Wave / Speed / Pause buttons (right side of HUD)
        const rightX = CONFIG.CANVAS_WIDTH - 160;
        this.startWaveBtn = { x: rightX, y: y, w: 70, h: 28, label: 'Next Wave' };
        this.speedBtn = { x: rightX + 76, y: y, w: 70, h: 28, label: '1x' };
        this.pauseBtn = { x: rightX, y: y + 34, w: 70, h: 28, label: 'Pause' };
    },

    /**
     * Handle mouse click
     */
    handleClick(mx, my, game) {
        // Check HUD area (below grid)
        const hudY = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE;
        if (my >= hudY) {
            return this.handleHudClick(mx, my, game);
        }

        // Check tower info panel buttons first (upgrade/sell/priority)
        if (this.selectedTower) {
            if (this._upgradeBtn && this.isInButton(mx, my, this._upgradeBtn)) {
                const tower = this.selectedTower;
                if (!tower.maxLevel) {
                    const cost = tower.upgradeCost;
                    if (game.gold >= cost) {
                        game.gold -= cost;
                        tower.upgrade();
                    }
                }
                return;
            }
            if (this._sellBtn && this.isInButton(mx, my, this._sellBtn)) {
                const tower = this.selectedTower;
                game.gold += tower.sellValue;
                GameMap.grid[tower.row][tower.col] = 0;
                game.towers = game.towers.filter(t => t !== tower);
                this.selectedTower = null;
                this._upgradeBtn = null;
                this._sellBtn = null;
                this._priorityBtn = null;
                return;
            }
            if (this._priorityBtn && this.isInButton(mx, my, this._priorityBtn)) {
                const idx = TARGET_PRIORITIES.indexOf(this.selectedTower.targetPriority);
                this.selectedTower.targetPriority = TARGET_PRIORITIES[(idx + 1) % TARGET_PRIORITIES.length];
                return;
            }
        }

        // Check grid area — place tower or select existing tower
        const { col, row } = Utils.pixelToGrid(mx, my);

        // Check if clicking on an existing tower
        const existing = game.towers.find(t => t.col === col && t.row === row);
        if (existing) {
            this.selectedTower = existing;
            this.selectedTowerType = null;
            return;
        }

        // Place tower
        if (this.selectedTowerType && GameMap.canBuild(col, row)) {
            // Check no tower already there
            const occupied = game.towers.some(t => t.col === col && t.row === row);
            if (!occupied) {
                const def = TOWER_TYPES[this.selectedTowerType];
                if (game.gold >= def.cost) {
                    game.gold -= def.cost;
                    const tower = new Tower(this.selectedTowerType, col, row);
                    game.towers.push(tower);
                    GameMap.grid[row][col] = 4; // mark as occupied
                    // Don't deselect — allow placing multiple
                }
            }
        } else {
            // Click on empty space — deselect
            this.selectedTower = null;
        }
    },

    handleHudClick(mx, my, game) {
        // Tower selection buttons
        for (const btn of this.towerButtons) {
            if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                const def = TOWER_TYPES[btn.key];
                if (def.unlockWave <= game.currentWave + 1) {
                    this.selectedTowerType = (this.selectedTowerType === btn.key) ? null : btn.key;
                    this.selectedTower = null;
                }
                return;
            }
        }

        // Start Wave button
        if (this.isInButton(mx, my, this.startWaveBtn)) {
            if (game.state === 'playing' && !game.waveActive) {
                game.startNextWave();
            }
            return;
        }

        // Speed button
        if (this.isInButton(mx, my, this.speedBtn)) {
            game.gameSpeed = game.gameSpeed === CONFIG.SPEED_NORMAL ? CONFIG.SPEED_FAST : CONFIG.SPEED_NORMAL;
            return;
        }

        // Pause button
        if (this.isInButton(mx, my, this.pauseBtn)) {
            if (game.state === 'playing') game.state = 'paused';
            else if (game.state === 'paused') game.state = 'playing';
            return;
        }
    },

    /**
     * Handle right click (tower info panel actions)
     */
    handleRightClick(mx, my, game) {
        // Deselect everything on right click
        this.selectedTowerType = null;

        const { col, row } = Utils.pixelToGrid(mx, my);
        const existing = game.towers.find(t => t.col === col && t.row === row);
        if (existing) {
            this.selectedTower = existing;
        } else {
            this.selectedTower = null;
        }
    },

    /**
     * Handle keyboard
     */
    handleKey(key, game) {
        // Number keys 1-6 to select towers
        const num = parseInt(key);
        if (num >= 1 && num <= 6) {
            const types = Object.keys(TOWER_TYPES);
            if (num <= types.length) {
                const tKey = types[num - 1];
                const def = TOWER_TYPES[tKey];
                if (def.unlockWave <= game.currentWave + 1) {
                    this.selectedTowerType = (this.selectedTowerType === tKey) ? null : tKey;
                    this.selectedTower = null;
                }
            }
            return;
        }

        // U = upgrade selected tower
        if (key === 'u' && this.selectedTower) {
            const tower = this.selectedTower;
            if (!tower.maxLevel) {
                const cost = tower.upgradeCost;
                if (game.gold >= cost) {
                    game.gold -= cost;
                    tower.upgrade();
                }
            }
            return;
        }

        // S = sell selected tower
        if (key === 's' && this.selectedTower) {
            const tower = this.selectedTower;
            game.gold += tower.sellValue;
            GameMap.grid[tower.row][tower.col] = 0; // restore grass
            game.towers = game.towers.filter(t => t !== tower);
            this.selectedTower = null;
            return;
        }

        // T = cycle target priority
        if (key === 't' && this.selectedTower) {
            const idx = TARGET_PRIORITIES.indexOf(this.selectedTower.targetPriority);
            this.selectedTower.targetPriority = TARGET_PRIORITIES[(idx + 1) % TARGET_PRIORITIES.length];
            return;
        }

        // Escape = deselect
        if (key === 'Escape') {
            this.selectedTowerType = null;
            this.selectedTower = null;
            return;
        }

        // Space = start next wave / pause
        if (key === ' ') {
            if (game.state === 'playing' && !game.waveActive) {
                game.startNextWave();
            } else if (game.state === 'playing') {
                game.state = 'paused';
            } else if (game.state === 'paused') {
                game.state = 'playing';
            }
            return;
        }
    },

    isInButton(mx, my, btn) {
        if (!btn) return false;
        return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
    },

    /**
     * Track mouse position for hover effects
     */
    handleMouseMove(mx, my) {
        const { col, row } = Utils.pixelToGrid(mx, my);
        if (Utils.inBounds(col, row)) {
            this.hoveredCell = { col, row };
        } else {
            this.hoveredCell = null;
        }
    },

    // ---- RENDERING ----

    /**
     * Render the full UI
     */
    render(ctx, game) {
        this.renderHud(ctx, game);
        this.renderTowerPanel(ctx, game);
        this.renderControlButtons(ctx, game);
        this.renderSelectedTowerInfo(ctx, game);
        this.renderPlacementPreview(ctx, game);
        this.renderWaveBanner(ctx, game);
    },

    renderHud(ctx, game) {
        const y = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE;

        // HUD background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, y, CONFIG.CANVAS_WIDTH, CONFIG.HUD_HEIGHT);

        // Divider line
        ctx.strokeStyle = '#e6a817';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();

        // Top info bar (lives, gold, wave) - render inside the game area at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 28);

        ctx.font = 'bold 14px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        // Lives
        ctx.fillStyle = '#ef5350';
        ctx.fillText(`❤️ ${game.lives}/${CONFIG.STARTING_LIVES}`, 10, 14);

        // Gold
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`💰 ${game.gold}g`, 140, 14);

        // Wave
        ctx.fillStyle = '#81d4fa';
        ctx.fillText(`🌊 Wave ${game.currentWave}/${CONFIG.TOTAL_WAVES}`, 280, 14);

        // Enemies remaining
        if (game.waveActive) {
            ctx.fillStyle = '#ff8a65';
            const remaining = game.enemies.filter(e => e.alive).length + game.spawnQueue.length;
            ctx.fillText(`Enemies: ${remaining}`, 440, 14);
        }

        // Speed indicator
        ctx.fillStyle = game.gameSpeed > 1 ? '#ffd54f' : '#90a4ae';
        ctx.fillText(`⏩ ${game.gameSpeed}x`, 590, 14);

        // Timer
        if (!game.waveActive && game.state === 'playing' && game.currentWave < CONFIG.TOTAL_WAVES) {
            ctx.fillStyle = '#a5d6a7';
            ctx.fillText(`Next wave: ${Math.ceil(game.waveBreakTimer)}s`, 680, 14);
        }
    },

    renderTowerPanel(ctx, game) {
        for (const btn of this.towerButtons) {
            const def = TOWER_TYPES[btn.key];
            const unlocked = def.unlockWave <= game.currentWave + 1;
            const affordable = game.gold >= def.cost;
            const selected = this.selectedTowerType === btn.key;

            // Button background
            if (selected) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            } else if (!unlocked) {
                ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
            }
            Utils.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 4);
            ctx.fill();

            // Border
            ctx.strokeStyle = selected ? '#e6a817' : unlocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
            ctx.lineWidth = selected ? 2 : 1;
            Utils.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 4);
            ctx.stroke();

            if (unlocked) {
                // Tower color dot
                ctx.fillStyle = def.color;
                ctx.beginPath();
                ctx.arc(btn.x + 14, btn.y + 16, 6, 0, Math.PI * 2);
                ctx.fill();

                // Tower name (abbreviated)
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(def.name.split(' ')[0], btn.x + 24, btn.y + 10);

                // Cost
                ctx.fillStyle = affordable ? '#ffd54f' : '#ef5350';
                ctx.font = '10px sans-serif';
                ctx.fillText(`${def.cost}g`, btn.x + 24, btn.y + 24);

                // Hotkey
                const idx = Object.keys(TOWER_TYPES).indexOf(btn.key) + 1;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`[${idx}]`, btn.x + btn.w - 4, btn.y + 48);
            } else {
                // Locked
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔒', btn.x + btn.w / 2, btn.y + btn.h / 2 - 6);
                ctx.fillText(`Wave ${def.unlockWave}`, btn.x + btn.w / 2, btn.y + btn.h / 2 + 10);
            }
        }
    },

    renderControlButtons(ctx, game) {
        // Start Wave button
        const swBtn = this.startWaveBtn;
        const canStart = game.state === 'playing' && !game.waveActive && game.currentWave < CONFIG.TOTAL_WAVES;
        ctx.fillStyle = canStart ? '#43a047' : '#555';
        Utils.roundRect(ctx, swBtn.x, swBtn.y, swBtn.w, swBtn.h, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(canStart ? 'Next Wave' : 'In Wave', swBtn.x + swBtn.w / 2, swBtn.y + swBtn.h / 2);

        // Speed button
        const spBtn = this.speedBtn;
        ctx.fillStyle = game.gameSpeed > 1 ? '#e6a817' : '#555';
        Utils.roundRect(ctx, spBtn.x, spBtn.y, spBtn.w, spBtn.h, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(game.gameSpeed > 1 ? '⏩ 2x' : '▶ 1x', spBtn.x + spBtn.w / 2, spBtn.y + spBtn.h / 2);

        // Pause button
        const pBtn = this.pauseBtn;
        ctx.fillStyle = game.state === 'paused' ? '#e6a817' : '#555';
        Utils.roundRect(ctx, pBtn.x, pBtn.y, pBtn.w, pBtn.h, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(game.state === 'paused' ? '▶ Resume' : '⏸ Pause', pBtn.x + pBtn.w / 2, pBtn.y + pBtn.h / 2);
    },

    renderSelectedTowerInfo(ctx, game) {
        if (!this.selectedTower) {
            this._upgradeBtn = null;
            this._sellBtn = null;
            this._priorityBtn = null;
            return;
        }

        const tower = this.selectedTower;
        const panelW = 180;
        const panelH = 155;
        let panelX = tower.x + 30;
        let panelY = tower.y - panelH / 2;

        // Keep panel within canvas
        if (panelX + panelW > CONFIG.CANVAS_WIDTH) panelX = tower.x - panelW - 30;
        if (panelY < 0) panelY = 5;
        if (panelY + panelH > CONFIG.GRID_ROWS * CONFIG.CELL_SIZE) panelY = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE - panelH - 5;

        // Background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.92)';
        Utils.roundRect(ctx, panelX, panelY, panelW, panelH, 6);
        ctx.fill();
        ctx.strokeStyle = '#e6a817';
        ctx.lineWidth = 1;
        Utils.roundRect(ctx, panelX, panelY, panelW, panelH, 6);
        ctx.stroke();

        const px = panelX + 8;
        let py = panelY + 16;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Name + Level
        ctx.fillStyle = tower.def.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${tower.def.name} Lv.${tower.level + 1}`, px, py);

        py += 18;
        ctx.fillStyle = '#ccc';
        ctx.font = '10px sans-serif';
        ctx.fillText(`DMG: ${Math.round(tower.damage)}  RNG: ${Math.round(tower.range)}  SPD: ${tower.fireRate.toFixed(2)}s`, px, py);

        py += 20;
        // Upgrade button (clickable)
        if (!tower.maxLevel) {
            const cost = tower.upgradeCost;
            const canAfford = game.gold >= cost;
            const ubx = px, uby = py - 8, ubw = 75, ubh = 22;
            ctx.fillStyle = canAfford ? '#43a047' : '#555';
            Utils.roundRect(ctx, ubx, uby, ubw, ubh, 3);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⬆ ${cost}g`, ubx + 37, py + 3);
            this._upgradeBtn = { x: ubx, y: uby, w: ubw, h: ubh };
        } else {
            ctx.fillStyle = '#888';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('MAX LEVEL', px, py + 3);
            this._upgradeBtn = null;
        }

        // Sell button (clickable)
        const sbx = px + 85, sby = py - 8, sbw = 75, sbh = 22;
        ctx.fillStyle = '#c62828';
        Utils.roundRect(ctx, sbx, sby, sbw, sbh, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`💰 ${tower.sellValue}g`, sbx + 37, py + 3);
        this._sellBtn = { x: sbx, y: sby, w: sbw, h: sbh };

        // Priority button (clickable)
        py += 28;
        const pbx = px, pby = py - 4, pbw = panelW - 16, pbh = 20;
        ctx.fillStyle = '#37474f';
        Utils.roundRect(ctx, pbx, pby, pbw, pbh, 3);
        ctx.fill();
        ctx.fillStyle = '#81d4fa';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Target: ${tower.targetPriority} ▼`, pbx + pbw / 2, pby + pbh / 2);
        this._priorityBtn = { x: pbx, y: pby, w: pbw, h: pbh };

        py += 18;
        ctx.fillStyle = '#888';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(tower.def.description, px, py + 6);
    },

    renderPlacementPreview(ctx, game) {
        if (!this.selectedTowerType || !this.hoveredCell) return;

        const { col, row } = this.hoveredCell;
        const canBuild = GameMap.canBuild(col, row) && !game.towers.some(t => t.col === col && t.row === row);
        const def = TOWER_TYPES[this.selectedTowerType];

        const x = col * CONFIG.CELL_SIZE;
        const y = row * CONFIG.CELL_SIZE;

        // Cell highlight
        ctx.fillStyle = canBuild ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255, 100, 100, 0.2)';
        ctx.fillRect(x, y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

        // Range preview
        const center = Utils.gridToPixel(col, row);
        ctx.strokeStyle = canBuild ? 'rgba(255,255,255,0.2)' : 'rgba(255,100,100,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center.x, center.y, def.range, 0, Math.PI * 2);
        ctx.stroke();

        // Tower preview
        if (canBuild) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = def.color;
            ctx.beginPath();
            ctx.arc(center.x, center.y, CONFIG.CELL_SIZE * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },

    renderWaveBanner(ctx, game) {
        if (game.waveBannerTimer > 0) {
            const alpha = Math.min(1, game.waveBannerTimer);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, CONFIG.GRID_ROWS * CONFIG.CELL_SIZE / 2 - 30, CONFIG.CANVAS_WIDTH, 60);

            ctx.fillStyle = '#e6a817';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let text = `Wave ${game.currentWave}`;
            // Boss warning
            if ([10, 20, 30].includes(game.currentWave)) {
                text += ' — BOSS WAVE!';
                ctx.fillStyle = '#ef5350';
            }

            ctx.fillText(text, CONFIG.CANVAS_WIDTH / 2, CONFIG.GRID_ROWS * CONFIG.CELL_SIZE / 2);
            ctx.globalAlpha = 1;
        }
    },

    /**
     * Render start screen
     */
    renderStartScreen(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Decorative border lines
        ctx.strokeStyle = 'rgba(230, 168, 23, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.strokeRect(20 + i * 15, 20 + i * 15, CONFIG.CANVAS_WIDTH - 40 - i * 30, CONFIG.CANVAS_HEIGHT - 40 - i * 30);
        }

        // Title glow
        ctx.shadowColor = '#e6a817';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#e6a817';
        ctx.font = 'bold 52px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TOWER DEFENSE', CONFIG.CANVAS_WIDTH / 2, 130);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.fillStyle = '#90a4ae';
        ctx.font = '16px sans-serif';
        ctx.fillText('Survive 30 waves. Defend your base.', CONFIG.CANVAS_WIDTH / 2, 175);

        // Divider
        ctx.strokeStyle = 'rgba(230, 168, 23, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CONFIG.CANVAS_WIDTH / 2 - 150, 200);
        ctx.lineTo(CONFIG.CANVAS_WIDTH / 2 + 150, 200);
        ctx.stroke();

        // How to play section
        ctx.fillStyle = '#e6a817';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('HOW TO PLAYZZZZZ', CONFIG.CANVAS_WIDTH / 2, 230);

        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        ctx.fillStyle = '#b0bec5';
        ctx.font = '13px sans-serif';
        const cx = CONFIG.CANVAS_WIDTH / 2;

        if (isMobile) {
            const tips = [
                '🏗  Tap a tower in the bottom panel, then tap the grid to place',
                '⬆  Tap a placed tower to upgrade, sell, or change priority',
                '🌊  Tap "Next Wave" to send the next wave of enemies',
                '⏩  Use Speed and Pause buttons to control game flow',
                '💰  Earn gold by killing enemies and completing waves',
            ];
            tips.forEach((tip, i) => {
                ctx.fillText(tip, cx, 262 + i * 22);
            });
        } else {
            const tips = [
                '🏗  Click to place towers  •  Keys 1-6 to select tower type',
                '⬆  U = Upgrade  •  S = Sell  •  T = Change target priority',
                '🌊  Space = Start next wave / Pause game',
                '⏩  Use Speed button or fast-forward for 2x speed',
                '💰  Earn gold by killing enemies and completing waves',
            ];
            tips.forEach((tip, i) => {
                ctx.fillText(tip, cx, 262 + i * 22);
            });
        }

        // Tower preview row
        ctx.fillStyle = '#e6a817';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('TOWERS', cx, 395);

        const types = Object.keys(TOWER_TYPES);
        const previewStartX = cx - (types.length * 50) / 2 + 25;
        types.forEach((key, i) => {
            const def = TOWER_TYPES[key];
            const px = previewStartX + i * 50;
            const py = 425;
            // Tower circle
            ctx.fillStyle = def.color;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
            // Name
            ctx.fillStyle = '#aaa';
            ctx.font = '9px sans-serif';
            ctx.fillText(def.name.split(' ')[0], px, py + 22);
        });

        // Play button
        const btnW = 200;
        const btnH = 55;
        const btnX = cx - btnW / 2;
        const btnY = 480;

        // Button shadow
        ctx.shadowColor = '#43a047';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#43a047';
        Utils.roundRect(ctx, btnX, btnY, btnW, btnH, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Button border
        ctx.strokeStyle = '#66bb6a';
        ctx.lineWidth = 2;
        Utils.roundRect(ctx, btnX, btnY, btnW, btnH, 10);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('▶  START GAME', cx, btnY + btnH / 2);

        // Store button region for click detection
        this._startBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        // Version / credit
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = '10px sans-serif';
        ctx.fillText('v1.0', cx, CONFIG.CANVAS_HEIGHT - 20);
    },

    /**
     * Render win screen
     */
    renderWinScreen(ctx, game) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Decorative border
        ctx.strokeStyle = 'rgba(255, 213, 79, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, CONFIG.CANVAS_WIDTH - 80, CONFIG.CANVAS_HEIGHT - 80);

        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = 20;
        ctx.fillText('🎉 VICTORY! 🎉', CONFIG.CANVAS_WIDTH / 2, 170);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ccc';
        ctx.font = '18px sans-serif';
        ctx.fillText(`You survived all ${CONFIG.TOTAL_WAVES} waves!`, CONFIG.CANVAS_WIDTH / 2, 230);

        // Stats
        ctx.fillStyle = '#90a4ae';
        ctx.font = '15px sans-serif';
        ctx.fillText(`❤️ Lives remaining: ${game.lives}`, CONFIG.CANVAS_WIDTH / 2, 270);
        ctx.fillText(`🏰 Towers built: ${game.towers.length}`, CONFIG.CANVAS_WIDTH / 2, 296);
        ctx.fillText(`💰 Gold remaining: ${game.gold}`, CONFIG.CANVAS_WIDTH / 2, 322);

        // Play Again button
        const btn1X = CONFIG.CANVAS_WIDTH / 2 - 90;
        const btn1Y = 370;
        ctx.fillStyle = '#43a047';
        Utils.roundRect(ctx, btn1X, btn1Y, 180, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('▶  Play Again', CONFIG.CANVAS_WIDTH / 2, btn1Y + 24);
        this._restartBtn = { x: btn1X, y: btn1Y, w: 180, h: 48 };

        // Back to Menu button
        const btn2X = CONFIG.CANVAS_WIDTH / 2 - 90;
        const btn2Y = 432;
        ctx.fillStyle = '#455a64';
        Utils.roundRect(ctx, btn2X, btn2Y, 180, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('←  Main Menu', CONFIG.CANVAS_WIDTH / 2, btn2Y + 24);
        this._menuBtn = { x: btn2X, y: btn2Y, w: 180, h: 48 };
    },

    /**
     * Render lose screen
     */
    renderLoseScreen(ctx, game) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Decorative border
        ctx.strokeStyle = 'rgba(239, 83, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, CONFIG.CANVAS_WIDTH - 80, CONFIG.CANVAS_HEIGHT - 80);

        ctx.fillStyle = '#ef5350';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ef5350';
        ctx.shadowBlur = 20;
        ctx.fillText('DEFEAT', CONFIG.CANVAS_WIDTH / 2, 180);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ccc';
        ctx.font = '18px sans-serif';
        ctx.fillText(`You reached wave ${game.currentWave} of ${CONFIG.TOTAL_WAVES}`, CONFIG.CANVAS_WIDTH / 2, 240);

        // Stats
        ctx.fillStyle = '#90a4ae';
        ctx.font = '15px sans-serif';
        ctx.fillText(`🏰 Towers built: ${game.towers.length}`, CONFIG.CANVAS_WIDTH / 2, 280);
        ctx.fillText(`💰 Gold remaining: ${game.gold}`, CONFIG.CANVAS_WIDTH / 2, 306);

        // Retry button
        const btn1X = CONFIG.CANVAS_WIDTH / 2 - 90;
        const btn1Y = 350;
        ctx.fillStyle = '#c62828';
        Utils.roundRect(ctx, btn1X, btn1Y, 180, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('↻  Retry', CONFIG.CANVAS_WIDTH / 2, btn1Y + 24);
        this._restartBtn = { x: btn1X, y: btn1Y, w: 180, h: 48 };

        // Back to Menu button
        const btn2X = CONFIG.CANVAS_WIDTH / 2 - 90;
        const btn2Y = 412;
        ctx.fillStyle = '#455a64';
        Utils.roundRect(ctx, btn2X, btn2Y, 180, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('←  Main Menu', CONFIG.CANVAS_WIDTH / 2, btn2Y + 24);
        this._menuBtn = { x: btn2X, y: btn2Y, w: 180, h: 48 };
    },

    /**
     * Render pause overlay
     */
    renderPauseOverlay(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸  PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#90a4ae';
        ctx.font = '16px sans-serif';
        ctx.fillText('Press Space or click Pause to resume', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
    },
};
