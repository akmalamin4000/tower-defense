// ============================================================
// map.js — Grid, path data, tile rendering
// ============================================================

const GameMap = {
    // 0 = grass (buildable), 1 = path, 2 = spawn, 3 = base
    grid: [],

    // Path waypoints as pixel coordinates (centers of path cells, in order)
    waypoints: [],

    /**
     * Initialize the map grid and path
     */
    init() {
        // Create empty grid (all grass)
        this.grid = [];
        for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < CONFIG.GRID_COLS; c++) {
                this.grid[r][c] = 0; // grass
            }
        }

        // Define path cells (row, col)
        const pathCells = [
            // Entrance from left, row 2
            [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5],
            // Down to row 5
            [3, 5], [4, 5], [5, 5],
            // Right across row 5
            [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12], [5, 13],
            // Up to row 2
            [4, 13], [3, 13], [2, 13],
            // Right across row 2 continued
            [2, 14], [2, 15], [2, 16], [2, 17],
            // Down to row 8
            [3, 17], [4, 17], [5, 17], [6, 17], [7, 17], [8, 17],
            // Left across row 8
            [8, 16], [8, 15], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [8, 8], [8, 7], [8, 6], [8, 5],
            // Down to row 11
            [9, 5], [10, 5], [11, 5],
            // Right across row 11 to base
            [11, 6], [11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [11, 12], [11, 13],
            // Right continue to exit
            [11, 14], [11, 15], [11, 16], [11, 17], [11, 18], [11, 19],
        ];

        // Mark path cells on grid
        pathCells.forEach(([r, c]) => {
            this.grid[r][c] = 1;
        });

        // Mark spawn and base
        this.grid[2][0] = 2; // spawn
        this.grid[11][19] = 3; // base

        // Build waypoints from path cells (pixel centers)
        this.waypoints = pathCells.map(([r, c]) => Utils.gridToPixel(c, r));
    },

    /**
     * Check if a grid cell is buildable
     */
    canBuild(col, row) {
        if (!Utils.inBounds(col, row)) return false;
        return this.grid[row][col] === 0;
    },

    /**
     * Render the map
     */
    render(ctx) {
        for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
            for (let c = 0; c < CONFIG.GRID_COLS; c++) {
                const x = c * CONFIG.CELL_SIZE;
                const y = r * CONFIG.CELL_SIZE;
                const cell = this.grid[r][c];

                // Base color
                if (cell === 0) {
                    // Grass — checkerboard pattern
                    ctx.fillStyle = (r + c) % 2 === 0 ? '#4a8c3f' : '#438536';
                } else if (cell === 1) {
                    // Path
                    ctx.fillStyle = '#c4a567';
                } else if (cell === 2) {
                    // Spawn
                    ctx.fillStyle = '#e57373';
                } else if (cell === 3) {
                    // Base
                    ctx.fillStyle = '#64b5f6';
                }

                ctx.fillRect(x, y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

                // Path border/detail
                if (cell === 1 || cell === 2 || cell === 3) {
                    ctx.strokeStyle = '#b8974e';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
                }

                // Spawn icon
                if (cell === 2) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '18px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🚪', x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE / 2);
                }

                // Base icon
                if (cell === 3) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '18px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🏠', x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE / 2);
                }
            }
        }
    },

    /**
     * Render grid overlay (shown when placing towers)
     */
    renderGrid(ctx) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 0.5;
        for (let r = 0; r <= CONFIG.GRID_ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * CONFIG.CELL_SIZE);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, r * CONFIG.CELL_SIZE);
            ctx.stroke();
        }
        for (let c = 0; c <= CONFIG.GRID_COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * CONFIG.CELL_SIZE, 0);
            ctx.lineTo(c * CONFIG.CELL_SIZE, CONFIG.GRID_ROWS * CONFIG.CELL_SIZE);
            ctx.stroke();
        }
    },
};
