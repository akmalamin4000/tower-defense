// ============================================================
// utils.js — Math helpers, collision, distance
// ============================================================

const Utils = {
    /**
     * Distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Angle from (x1,y1) to (x2,y2) in radians
     */
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    /**
     * Convert grid col/row to pixel center
     */
    gridToPixel(col, row) {
        return {
            x: col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
            y: row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
        };
    },

    /**
     * Convert pixel position to grid col/row
     */
    pixelToGrid(x, y) {
        return {
            col: Math.floor(x / CONFIG.CELL_SIZE),
            row: Math.floor(y / CONFIG.CELL_SIZE),
        };
    },

    /**
     * Check if grid position is within bounds
     */
    inBounds(col, row) {
        return col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS;
    },

    /**
     * Clamp value between min and max
     */
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Random integer between min and max (inclusive)
     */
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Random float between min and max
     */
    randFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Draw a rounded rectangle
     */
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    /**
     * Format gold display
     */
    formatGold(amount) {
        return amount.toLocaleString() + 'g';
    },
};
