// ============================================================
// tower.js — Tower classes, targeting, shooting, upgrades
// ============================================================

class Tower {
    constructor(type, col, row) {
        const def = TOWER_TYPES[type];
        this.type = type;
        this.def = def;
        this.col = col;
        this.row = row;

        const pos = Utils.gridToPixel(col, row);
        this.x = pos.x;
        this.y = pos.y;

        this.level = 0; // 0 = level 1, 1 = level 2, 2 = level 3
        this.totalInvested = def.cost; // tracks total gold spent (for sell)

        this.fireCooldown = 0;
        this.target = null;
        this.targetPriority = 'first'; // first, closest, strongest, weakest

        // Visual
        this.angle = 0; // rotation toward target
    }

    get damage() {
        return this.def.damage * UPGRADE_LEVELS.damageMultiplier[this.level];
    }

    get range() {
        return this.def.range * UPGRADE_LEVELS.rangeMultiplier[this.level];
    }

    get fireRate() {
        return this.def.fireRate * UPGRADE_LEVELS.fireRateMultiplier[this.level];
    }

    get upgradeCost() {
        if (this.level >= 2) return null; // max level
        return Math.round(this.def.cost * UPGRADE_LEVELS.costMultiplier[this.level + 1]);
    }

    get sellValue() {
        return Math.round(this.totalInvested * CONFIG.SELL_REFUND_RATIO);
    }

    get maxLevel() {
        return this.level >= 2;
    }

    /**
     * Upgrade tower to next level
     */
    upgrade() {
        if (this.maxLevel) return false;
        const cost = this.upgradeCost;
        this.level++;
        this.totalInvested += cost;
        return cost;
    }

    /**
     * Find best target from enemy list based on priority
     */
    findTarget(enemies) {
        let best = null;
        let bestValue = null;

        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            if (enemy.isInvisible) continue; // can't target invisible

            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist > this.range) continue;

            switch (this.targetPriority) {
                case 'first':
                    // Furthest along the path (highest waypoint index)
                    if (best === null || enemy.waypointIndex > bestValue) {
                        best = enemy;
                        bestValue = enemy.waypointIndex;
                    }
                    break;
                case 'closest':
                    if (best === null || dist < bestValue) {
                        best = enemy;
                        bestValue = dist;
                    }
                    break;
                case 'strongest':
                    if (best === null || enemy.hp > bestValue) {
                        best = enemy;
                        bestValue = enemy.hp;
                    }
                    break;
                case 'weakest':
                    if (best === null || enemy.hp < bestValue) {
                        best = enemy;
                        bestValue = enemy.hp;
                    }
                    break;
            }
        }

        return best;
    }

    /**
     * Update tower — targeting, shooting
     * Returns array of new projectiles
     */
    update(dt, enemies) {
        const newProjectiles = [];

        // Cooldown
        this.fireCooldown -= dt;

        // Find target
        this.target = this.findTarget(enemies);

        if (this.target) {
            // Rotate toward target
            this.angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);

            // Fire!
            if (this.fireCooldown <= 0) {
                this.fireCooldown = this.fireRate;

                if (this.def.special === 'chain') {
                    // Lightning: instant hit + chain
                    this.lightningAttack(enemies);
                } else if (this.def.special === 'burn') {
                    // Flame: area damage
                    this.flameAttack(enemies);
                } else {
                    // Normal projectile
                    newProjectiles.push(
                        new Projectile(this.x, this.y, this.target, this.def, this.level, this.def.special)
                    );
                }
            }
        }

        return newProjectiles;
    }

    /**
     * Lightning chain attack
     */
    lightningAttack(enemies) {
        const chainCount = this.def.chainCount || 3;
        const chainRange = this.def.chainRange || 80;
        const damage = this.damage;
        const hit = [this.target];

        // Hit primary target
        this.target.takeDamage(damage, false);
        Effects.spawnLightning(this.x, this.y, this.target.x, this.target.y, this.def.projectileColor);

        // Chain to nearby enemies
        let current = this.target;
        for (let i = 0; i < chainCount - 1; i++) {
            let closest = null;
            let closestDist = Infinity;
            for (const enemy of enemies) {
                if (!enemy.alive || hit.includes(enemy) || enemy.isInvisible) continue;
                const dist = Utils.distance(current.x, current.y, enemy.x, enemy.y);
                if (dist <= chainRange && dist < closestDist) {
                    closest = enemy;
                    closestDist = dist;
                }
            }
            if (closest) {
                closest.takeDamage(damage * 0.6, false); // chain does 60% damage
                Effects.spawnLightning(current.x, current.y, closest.x, closest.y, this.def.projectileColor);
                hit.push(closest);
                current = closest;
            } else {
                break;
            }
        }
    }

    /**
     * Flame area attack
     */
    flameAttack(enemies) {
        const damage = this.damage;
        for (const enemy of enemies) {
            if (!enemy.alive || enemy.isInvisible) continue;
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= this.range) {
                enemy.takeDamage(damage, false);
                enemy.applyBurn(this.def.burnDamage, this.def.burnDuration);
            }
        }
        // Flame visual
        Effects.spawnBurst(
            this.x + Math.cos(this.angle) * 20,
            this.y + Math.sin(this.angle) * 20,
            '#ff6e40', 3, 40, 0.3
        );
    }

    /**
     * Render the tower
     */
    render(ctx, isSelected = false) {
        const x = this.x;
        const y = this.y;
        const size = CONFIG.CELL_SIZE * 0.35;

        // Range circle (if selected)
        if (isSelected) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, this.range, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.arc(x, y, this.range, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tower base (dark circle)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x, y, size + 3, 0, Math.PI * 2);
        ctx.fill();

        // Tower body
        ctx.fillStyle = this.def.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Tower barrel/direction indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(this.angle) * (size + 6),
            y + Math.sin(this.angle) * (size + 6)
        );
        ctx.stroke();

        // Level indicator (dots)
        if (this.level > 0) {
            for (let i = 0; i < this.level; i++) {
                ctx.fillStyle = '#ffd54f';
                ctx.beginPath();
                ctx.arc(
                    x - (this.level - 1) * 4 + i * 8,
                    y + size + 6,
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        // Flame tower aura
        if (this.def.special === 'burn' && this.target) {
            ctx.strokeStyle = 'rgba(255, 110, 64, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
