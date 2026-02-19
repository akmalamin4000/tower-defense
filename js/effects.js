// ============================================================
// effects.js — Particles & visual effects
// ============================================================

const Effects = {
    particles: [],

    /**
     * Spawn a burst of particles at a position
     */
    spawnBurst(x, y, color, count = 8, speed = 80, lifetime = 0.5) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Utils.randFloat(-0.3, 0.3);
            const spd = Utils.randFloat(speed * 0.5, speed);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: lifetime,
                maxLife: lifetime,
                color,
                size: Utils.randFloat(2, 5),
            });
        }
    },

    /**
     * Spawn a damage number floating text
     */
    spawnDamageNumber(x, y, damage, color = '#fff') {
        this.particles.push({
            x,
            y,
            vx: Utils.randFloat(-15, 15),
            vy: -50,
            life: 0.8,
            maxLife: 0.8,
            color,
            text: Math.round(damage).toString(),
            isText: true,
            size: 12,
        });
    },

    /**
     * Spawn splash ring effect
     */
    spawnSplashRing(x, y, radius, color) {
        this.particles.push({
            x, y,
            vx: 0, vy: 0,
            life: 0.3,
            maxLife: 0.3,
            color,
            isRing: true,
            radius,
            size: 0,
        });
    },

    /**
     * Spawn lightning bolt visual between two points
     */
    spawnLightning(x1, y1, x2, y2, color = '#fff176') {
        this.particles.push({
            x: x1, y: y1,
            x2, y2,
            vx: 0, vy: 0,
            life: 0.2,
            maxLife: 0.2,
            color,
            isLightning: true,
            size: 0,
        });
    },

    /**
     * Update all particles
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    },

    /**
     * Render all particles
     */
    render(ctx) {
        for (const p of this.particles) {
            const alpha = Utils.clamp(p.life / p.maxLife, 0, 1);

            if (p.isText) {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.text, p.x, p.y);
                ctx.globalAlpha = 1;
            } else if (p.isRing) {
                ctx.globalAlpha = alpha * 0.6;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                const progress = 1 - (p.life / p.maxLife);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * progress, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (p.isLightning) {
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                // Jagged lightning segments
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                const segments = 5;
                for (let s = 1; s < segments; s++) {
                    const t = s / segments;
                    const mx = Utils.lerp(p.x, p.x2, t) + Utils.randFloat(-8, 8);
                    const my = Utils.lerp(p.y, p.y2, t) + Utils.randFloat(-8, 8);
                    ctx.lineTo(mx, my);
                }
                ctx.lineTo(p.x2, p.y2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            } else {
                // Regular particle
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    },

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    },
};
