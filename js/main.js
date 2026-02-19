// ============================================================
// main.js — Entry point, canvas setup, game loop, input
// ============================================================

(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Initialize game
    Game.init();

    // ---- Input Handling ----

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (Game.state === 'menu') {
            // Check play button
            if (UI._startBtn && UI.isInButton(mx, my, UI._startBtn)) {
                Game.startGame();
            }
            return;
        }

        if (Game.state === 'win' || Game.state === 'lose') {
            if (UI._restartBtn && UI.isInButton(mx, my, UI._restartBtn)) {
                Game.init();
                Game.startGame();
            }
            return;
        }

        UI.handleClick(mx, my, Game);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        UI.handleRightClick(mx, my, Game);
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        UI.handleMouseMove(mx, my);
    });

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
                Game.init();
                Game.startGame();
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
