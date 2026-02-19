// ============================================================
// enemy.js — Enemy classes, movement, abilities
// ============================================================

class Enemy {
    constructor(type, waveNumber) {
        const def = ENEMY_TYPES[type];
        this.type = type;
        this.name = def.name;
        this.isBoss = def.isBoss || false;

        // Scale HP slightly per wave for later waves
        const hpScale = 1 + (waveNumber - 1) * 0.03;
        this.maxHp = Math.round(def.hp * hpScale);
        this.hp = this.maxHp;

        this.speed = def.speed;
        this.baseSpeed = def.speed;
        this.armor = def.armor;
        this.reward = def.reward;
        this.color = def.color;
        this.size = def.size;
        this.special = def.special;

        // Special properties
        if (def.special === 'heal') {
            this.healAmount = def.healAmount;
            this.healRange = def.healRange;
            this.healTimer = 0;
        }
        if (def.special === 'shield') {
            this.shieldRange = def.shieldRange;
            this.shieldReduction = def.shieldReduction;
        }
        if (def.special === 'invisible') {
            this.invisInterval = def.invisInterval;
            this.invisDuration = def.invisDuration;
            this.invisTimer = def.invisInterval;
            this.isInvisible = false;
            this.invisCountdown = 0;
        }

        // Path following
        this.waypointIndex = 0;
        this.x = GameMap.waypoints[0].x;
        this.y = GameMap.waypoints[0].y;

        // Status effects
        this.slowAmount = 0;
        this.slowTimer = 0;
        this.burnDamage = 0;
        this.burnTimer = 0;
        this.shielded = false; // currently shielded by a shield bearer

        // State
        this.alive = true;
        this.reachedEnd = false;
    }

    /**
     * Apply slow effect
     */
    applySlow(amount, duration) {
        // Only apply if stronger slow
        if (amount > this.slowAmount || duration > this.slowTimer) {
            this.slowAmount = amount;
            this.slowTimer = duration;
        }
    }

    /**
     * Apply burn effect
     */
    applyBurn(dps, duration) {
        this.burnDamage = dps;
        this.burnTimer = duration;
    }

    /**
     * Take damage (after armor calculation)
     */
    takeDamage(damage, ignoreArmor = false) {
        if (!this.alive) return;
        if (this.isInvisible) return; // can't be hit while invisible

        let effectiveDamage = damage;

        // Apply armor
        if (!ignoreArmor) {
            effectiveDamage = Math.max(1, damage - this.armor);
        }

        // Apply shield bearer reduction
        if (this.shielded) {
            effectiveDamage *= (1 - 0.3);
        }

        this.hp -= effectiveDamage;

        // Spawn damage number
        Effects.spawnDamageNumber(
            this.x + Utils.randFloat(-5, 5),
            this.y - this.size - 5,
            effectiveDamage,
            ignoreArmor ? '#ce93d8' : '#fff'
        );

        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            // Death effect
            Effects.spawnBurst(this.x, this.y, this.color, this.isBoss ? 20 : 10);
        }
    }

    /**
     * Update enemy position and status effects
     */
    update(dt, enemies) {
        if (!this.alive) return;

        // Burn damage
        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.hp -= this.burnDamage * dt;
            if (this.hp <= 0) {
                this.hp = 0;
                this.alive = false;
                Effects.spawnBurst(this.x, this.y, '#ff8a65', 10);
                return;
            }
        }

        // Slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * (1 - this.slowAmount);
        } else {
            this.slowAmount = 0;
            this.speed = this.baseSpeed;
        }

        // Invisible (Shadow Lord)
        if (this.special === 'invisible') {
            if (this.isInvisible) {
                this.invisCountdown -= dt;
                if (this.invisCountdown <= 0) {
                    this.isInvisible = false;
                    this.invisTimer = this.invisInterval;
                }
            } else {
                this.invisTimer -= dt;
                if (this.invisTimer <= 0) {
                    this.isInvisible = true;
                    this.invisCountdown = this.invisDuration;
                }
            }
        }

        // Healer ability
        if (this.special === 'heal') {
            this.healTimer += dt;
            if (this.healTimer >= 1.0) { // heal once per second
                this.healTimer -= 1.0;
                for (const other of enemies) {
                    if (other === this || !other.alive) continue;
                    const dist = Utils.distance(this.x, this.y, other.x, other.y);
                    if (dist <= this.healRange) {
                        other.hp = Math.min(other.maxHp, other.hp + this.healAmount);
                    }
                }
            }
        }

        // Shield bearer — mark nearby enemies as shielded each frame
        // (Shield check is done in Game.update for all enemies)

        // Move along path
        if (this.waypointIndex < GameMap.waypoints.length) {
            const target = GameMap.waypoints[this.waypointIndex];
            const dist = Utils.distance(this.x, this.y, target.x, target.y);
            const moveDistance = this.speed * dt;

            if (dist <= moveDistance) {
                this.x = target.x;
                this.y = target.y;
                this.waypointIndex++;
            } else {
                const angle = Utils.angle(this.x, this.y, target.x, target.y);
                this.x += Math.cos(angle) * moveDistance;
                this.y += Math.sin(angle) * moveDistance;
            }
        }

        // Check if reached end
        if (this.waypointIndex >= GameMap.waypoints.length) {
            this.reachedEnd = true;
            this.alive = false;
        }
    }

    /**
     * Render the enemy
     */
    render(ctx) {
        if (!this.alive) return;

        // Invisible effect
        if (this.isInvisible) {
            ctx.globalAlpha = 0.15;
        }

        // Body
        ctx.fillStyle = this.color;

        // Slow tint
        if (this.slowTimer > 0) {
            ctx.fillStyle = '#81d4fa';
        }

        // Burn tint
        if (this.burnTimer > 0) {
            ctx.fillStyle = this.burnTimer % 0.2 < 0.1 ? '#ff6e40' : this.color;
        }

        // Draw enemy shape
        if (this.isBoss) {
            // Boss: hexagon-ish
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const px = this.x + Math.cos(a) * this.size;
                const py = this.y + Math.sin(a) * this.size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // Boss outline
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Regular: circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shield indicator
        if (this.shielded) {
            ctx.strokeStyle = '#7986cb';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Healer aura
        if (this.special === 'heal') {
            ctx.strokeStyle = 'rgba(102, 187, 106, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.healRange, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2.5;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 8;
            const hpRatio = this.hp / this.maxHp;

            // Background
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            // HP fill
            ctx.fillStyle = hpRatio > 0.5 ? '#66bb6a' : hpRatio > 0.25 ? '#ffa726' : '#ef5350';
            ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
        }

        // Armor indicator (small number)
        if (this.armor > 0) {
            ctx.fillStyle = '#b0bec5';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡' + this.armor, this.x, this.y + this.size + 8);
        }
    }
}
