// ============================================================
// main.js — Entry point, canvas setup, game loop, input
// ============================================================

(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // ---- High-DPI (Retina) fix ----
    // Scale canvas internal resolution by devicePixelRatio so text/graphics are sharp.
    // All game logic still uses 800×640 coordinates thanks to ctx.scale().
    function setupHiDPI() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = CONFIG.CANVAS_WIDTH * dpr;
        canvas.height = CONFIG.CANVAS_HEIGHT * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setupHiDPI();

    // Re-apply on resize (handles orientation change on mobile)
    window.addEventListener('resize', setupHiDPI);

    // Initialize game
    Game.init();

    // ---- Coordinate Scaling ----
    // Input coordinates must map from CSS display size to logical 800×640.

    function getScaledCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
        const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }

    // ---- Input Handling (Mouse) ----

    // Track last touch time to prevent click/touch double-fire
    let lastTouchTime = 0;

    function handlePointerDown(mx, my) {
        if (Game.state === 'menu') {
            if (UI._startBtn && UI.isInButton(mx, my, UI._startBtn)) {
                Game.startGame();
            }
            return;
        }

        if (Game.state === 'win' || Game.state === 'lose') {
            // "Play Again" / "Retry" button
            if (UI._restartBtn && UI.isInButton(mx, my, UI._restartBtn)) {
                Game.init();
                Game.startGame();
                return;
            }
            // "Main Menu" button
            if (UI._menuBtn && UI.isInButton(mx, my, UI._menuBtn)) {
                Game.init(); // resets state to 'menu'
                return;
            }
            return;
        }

        if (Game.state === 'paused') {
            Game.state = 'playing';
            return;
        }

        UI.handleClick(mx, my, Game);
    }

    canvas.addEventListener('click', (e) => {
        // Skip synthetic click events triggered by touch (within 500ms)
        if (Date.now() - lastTouchTime < 500) return;
        const { x, y } = getScaledCoords(e.clientX, e.clientY);
        handlePointerDown(x, y);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const { x, y } = getScaledCoords(e.clientX, e.clientY);
        UI.handleRightClick(x, y, Game);
    });

    canvas.addEventListener('mousemove', (e) => {
        const { x, y } = getScaledCoords(e.clientX, e.clientY);
        UI.handleMouseMove(x, y);
    });

    // ---- Input Handling (Touch — Mobile) ----

    let touchMoved = false;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchMoved = false;
        lastTouchTime = Date.now();
        const touch = e.touches[0];
        const { x, y } = getScaledCoords(touch.clientX, touch.clientY);
        UI.handleMouseMove(x, y); // update hover preview
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touchMoved = true;
        const touch = e.touches[0];
        const { x, y } = getScaledCoords(touch.clientX, touch.clientY);
        UI.handleMouseMove(x, y); // update hover preview while dragging
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        lastTouchTime = Date.now();
        if (!touchMoved && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const { x, y } = getScaledCoords(touch.clientX, touch.clientY);
            handlePointerDown(x, y);
        }
        touchMoved = false;
    }, { passive: false });

    // ---- Keyboard ----

    document.addEventListener('keydown', (e) => {
        if (Game.state === 'menu') {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                Game.startGame();
            }
            return;
        }

        if (Game.state === 'win' || Game.state === 'lose') {
            if (e.key === ' ' || e.key === 'Enter') {
                Game.init(); // go back to menu
            }
            return;
        }

        if (e.key === ' ') e.preventDefault();
        UI.handleKey(e.key, Game);
    });

    // ---- Game Loop ----

    let lastTime = 0;

    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
        lastTime = timestamp;

        Game.update(dt);
        Game.render(ctx);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame((timestamp) => {
        lastTime = timestamp;
        gameLoop(timestamp);
    });
})();
