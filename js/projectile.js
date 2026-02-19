// ============================================================
// projectile.js — Projectile movement, hit detection, effects
// ============================================================

class Projectile {
    constructor(x, y, target, towerDef, level, towerSpecial) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = towerDef.projectileSpeed;
        this.color = towerDef.projectileColor;
        this.size = towerDef.projectileSize;

        // Damage with upgrade scaling
        this.damage = towerDef.damage * UPGRADE_LEVELS.damageMultiplier[level];

        this.special = towerSpecial;
        this.towerDef = towerDef;
        this.level = level;

        this.alive = true;
    }

    update(dt, enemies) {
        if (!this.alive) return;
        if (!this.target || !this.target.alive) {
            this.alive = false;
            return;
        }

        // Move toward target
        const dist = Utils.distance(this.x, this.y, this.target.x, this.target.y);
        const moveDistance = this.speed * dt;

        if (dist <= moveDistance + this.target.size) {
            // Hit!
            this.hit(enemies);
            this.alive = false;
        } else {
            const angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
            this.x += Math.cos(angle) * moveDistance;
            this.y += Math.sin(angle) * moveDistance;
        }
    }

    hit(enemies) {
        const ignoreArmor = this.special === 'pierce_armor';

        // Apply damage to target
        this.target.takeDamage(this.damage, ignoreArmor);

        // Splash damage (Cannon)
        if (this.special === 'splash' && this.towerDef.splash > 0) {
            Effects.spawnSplashRing(this.target.x, this.target.y, this.towerDef.splash, this.color);
            for (const enemy of enemies) {
                if (enemy === this.target || !enemy.alive) continue;
                const dist = Utils.distance(this.target.x, this.target.y, enemy.x, enemy.y);
                if (dist <= this.towerDef.splash) {
                    const splashDmg = this.damage * 0.5; // 50% splash damage
                    enemy.takeDamage(splashDmg, false);
                }
            }
        }

        // Slow effect (Ice)
        if (this.special === 'slow') {
            this.target.applySlow(this.towerDef.slowAmount, this.towerDef.slowDuration);
        }

        // Burn effect (Flame)
        if (this.special === 'burn') {
            this.target.applyBurn(this.towerDef.burnDamage, this.towerDef.burnDuration);
        }
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
