// ============================================================
// main.js — Entry point, canvas setup, game loop, input
// ============================================================

(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Initialize game
    Game.init();

    // ---- Coordinate Scaling ----
    // Canvas CSS size may differ from internal resolution (800x640).
    // All input coordinates must be scaled to internal resolution.

    function getScaledCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
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
