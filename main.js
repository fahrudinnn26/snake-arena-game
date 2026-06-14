/**
 * main.js - Core Engine & Event Orchestrator
 * Versi Optimasi: High-DPI Anti-Blur & Responsive High Score Display
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pCanvas = document.getElementById('previewCanvas');
const pCtx = pCanvas ? pCanvas.getContext('2d') : null;

let lastFrameTime = performance.now();
let snakes = [];
let previewSnake = null;

let hardwareGame = null;
let isPlaying = false; 

// ====================================================
// INTEL INTELLIGENT RESPONSIVE STYLE INJECTION
// Mencegah box High Score nabrak tombol menu di layar HP
// ====================================================
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    #hs-display {
        position: absolute;
        bottom: 30px;
        right: 40px;
        color: #ffaa00;
        font-family: 'Share Tech Mono', monospace;
        font-size: 1.4rem;
        font-weight: bold;
        text-shadow: 0 0 15px #ffaa00;
        z-index: 100;
        padding: 12px 20px;
        border: 2px solid #ffaa00;
        background: rgba(255, 170, 0, 0.1);
        text-align: right;
        border-radius: 8px;
        transition: all 0.3s ease;
    }
    @media screen and (max-height: 650px), screen and (max-width: 800px) {
        #hs-display {
            position: relative !important;
            bottom: auto !important;
            right: auto !important;
            margin: 20px auto 0 auto !important;
            text-align: center !important;
            width: 90% !important;
            max-width: 340px !important;
        }
    }
`;
document.head.appendChild(styleFix);

// ====================================================
// HIGH-DPI RETINA SCALING ENGINE (ANTI-BURIK HP)
// Menyuntikkan manipulasi getter/setter internal canvas
// ====================================================
const originalWidthDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
const originalHeightDesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');

let logicalWidth = window.innerWidth;
let logicalHeight = window.innerHeight;

Object.defineProperty(canvas, 'width', {
    get() { return logicalWidth; },
    set(val) {
        logicalWidth = val;
        const dpr = window.devicePixelRatio || 1;
        originalWidthDesc.set.call(canvas, val * dpr);
        canvas.style.width = val + 'px';
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
    }
});

Object.defineProperty(canvas, 'height', {
    get() { return logicalHeight; },
    set(val) {
        logicalHeight = val;
        const dpr = window.devicePixelRatio || 1;
        originalHeightDesc.set.call(canvas, val * dpr);
        canvas.style.height = val + 'px';
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
    }
});

// Fungsi resize pintar yang menjaga ketajaman resolusi layar
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (hardwareGame && typeof hardwareGame.resize === 'function') {
        hardwareGame.resize();
    }
}
window.onresize = resize;
resize();

function loadCustomizations() {
    const savedName = localStorage.getItem('snakeArena_name');
    if (savedName) document.getElementById('player-name-input').value = savedName;

    const savedColor = localStorage.getItem('snakeArena_color');
    if (savedColor !== null) {
        document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
        const activeOpt = document.querySelector(`.color-opt[data-index="${savedColor}"]`);
        if (activeOpt) activeOpt.classList.add('active');
        if (typeof playerColorIdx !== 'undefined') playerColorIdx = parseInt(savedColor);
    }

    const savedVol = localStorage.getItem('snakeArena_vol');
    if (savedVol !== null) {
        document.getElementById('vol-slider').value = savedVol;
        if (typeof sounds !== 'undefined') sounds.setVolume(parseFloat(savedVol));
    }

    const savedFps = localStorage.getItem('snakeArena_fps');
    if (savedFps !== null) document.getElementById('fps-select').value = savedFps;

    const savedGfx = localStorage.getItem('snakeArena_gfx');
    if (savedGfx !== null) document.getElementById('graphic-select').value = savedGfx;

    const savedMap = localStorage.getItem('snakeArena_map');
    if (savedMap) {
        document.querySelectorAll('.map-opt').forEach(o => {
            o.classList.remove('active');
            o.style.border = "2px solid #333";
        });
        const activeMap = document.querySelector(`.map-opt[data-map="${savedMap}"]`);
        if (activeMap) {
            activeMap.classList.add('active');
            activeMap.style.border = savedMap === 'CYBER' ? "2px solid #00f2ff" : "2px solid #a0eeff";
            activeMap.style.background = savedMap === 'CYBER' ? 'rgba(0, 242, 255, 0.2)' : 'rgba(160, 238, 255, 0.2)';
        }
    }
}

function setupAutoSave() {
    document.getElementById('player-name-input').addEventListener('input', (e) => localStorage.setItem('snakeArena_name', e.target.value));
    
    document.getElementById('vol-slider').addEventListener('input', (e) => {
        localStorage.setItem('snakeArena_vol', e.target.value);
        if (typeof sounds !== 'undefined') sounds.setVolume(parseFloat(e.target.value));
    });
    
    document.getElementById('fps-select').addEventListener('change', (e) => localStorage.setItem('snakeArena_fps', e.target.value));
    document.getElementById('graphic-select').addEventListener('change', (e) => localStorage.setItem('snakeArena_gfx', e.target.value));

    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.onclick = (e) => {
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
            e.target.classList.add('active');
            let idx = e.target.dataset.index;
            if (typeof playerColorIdx !== 'undefined') playerColorIdx = parseInt(idx);
            localStorage.setItem('snakeArena_color', idx); 
        };
    });

    document.querySelectorAll('.map-opt').forEach(opt => {
        opt.onclick = (e) => {
            document.querySelectorAll('.map-opt').forEach(o => {
                o.classList.remove('active');
                o.style.background = 'rgba(255,255,255,0.05)';
                o.style.border = "2px solid #333";
            });
            e.target.classList.add('active');
            e.target.style.border = e.target.dataset.map === 'CYBER' ? "2px solid #00f2ff" : "2px solid #a0eeff";
            e.target.style.background = e.target.dataset.map === 'CYBER' ? 'rgba(0, 242, 255, 0.2)' : 'rgba(160, 238, 255, 0.2)';
            localStorage.setItem('snakeArena_map', e.target.dataset.map);
        };
    });
}

window.onload = () => {
    loadCustomizations();
    setupAutoSave();

    if (typeof targetFps !== 'undefined') targetFps = parseInt(document.getElementById('fps-select').value);
    
    snakes = Array.from({ length: typeof snakeCount !== 'undefined' ? snakeCount : 10 }, () => new DemoSnake());
    previewSnake = new DemoSnake(true);
    
    if (typeof showScreen === 'function') {
        showScreen('main-menu'); 
    }

    // TOGGLE FULLSCREEN API SYNC
    const btnFsToggle = document.getElementById('btn-fs-toggle');
    if (btnFsToggle) {
        btnFsToggle.addEventListener('click', () => {
            let el = document.documentElement;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
                else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
                try { if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(e=>{}); } } catch(e){}
            } else {
                if (document.exitFullscreen) { document.exitFullscreen(); }
                else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
            }
            setTimeout(() => { resize(); }, 500);
        });
    }

    // Injeksi Box Skor Terakhir ke Main Menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu && !document.getElementById('hs-display')) {
        const lastScore = localStorage.getItem('snakeArena_lastScore') || 0;
        const lastPCs = localStorage.getItem('snakeArena_lastPCs') || 0;
        const lastLvl = localStorage.getItem('snakeArena_lastLevel') || 'N/A';
        
        const hsDiv = document.createElement('div');
        hsDiv.id = 'hs-display';
        
        hsDiv.innerHTML = `
            <div style="font-size:0.8rem; color:#fff; text-shadow:none; margin-bottom:3px;">LAST MATCH (${lastLvl})</div>
            SCORE: ${lastScore}
            <div style="font-size:1rem; color:#00f2ff; text-shadow:0 0 10px #00f2ff; margin-top:5px;">
                🏆 PC BUILT: ${lastPCs}
            </div>
        `;
        mainMenu.appendChild(hsDiv);
    }
    
    // Tombol Menu Statistik
    const btnStats = document.getElementById('btn-stats');
    const btnStatsBack = document.getElementById('btn-stats-back');
    const statsContainer = document.getElementById('stats-container');

    if (btnStats) {
        btnStats.onclick = () => {
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            document.getElementById('stats-menu').classList.add('active');

            const diffs = [
                { key: "1", name: "CORE i3 (EASY)", color: "#00f2ff" },
                { key: "1.5", name: "CORE i5 (NORMAL)", color: "#39ff14" },
                { key: "2", name: "CORE i7 (HARD)", color: "#ffaa00" },
                { key: "3", name: "CORE i9 (EXTREME)", color: "#ff007f" }
            ];

            let htmlContent = "";
            diffs.forEach(d => {
                let hs = localStorage.getItem(`snakeArena_HS_${d.key}`) || 0;
                let pc = localStorage.getItem(`snakeArena_PC_${d.key}`) || 0;
                
                htmlContent += `
                    <div style="border-left: 4px solid ${d.color}; padding: 10px 15px; background: rgba(0,0,0,0.5); display: flex; justify-content: space-between; align-items: center;">
                        <span style="color:${d.color}; font-weight:bold; font-size:1.1rem;">${d.name}</span>
                        <div style="text-align:right;">
                            <div style="color:#fff; font-size:1rem;">SCORE: ${hs}</div>
                            <div style="color:#ccc; font-size:0.85rem;">PC BUILT: ${pc}</div>
                        </div>
                    </div>
                `;
            });
            statsContainer.innerHTML = htmlContent;
        };
    }

    if (btnStatsBack) {
        btnStatsBack.onclick = () => {
            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            document.getElementById('main-menu').classList.add('active');
        };
    }

    const btnSettingsBack = document.getElementById('btn-settings-back');
    if (btnSettingsBack) {
        btnSettingsBack.addEventListener('click', () => {
            if (typeof snakeCount !== 'undefined') snakeCount = parseInt(document.getElementById('graphic-select').value);
            if (typeof targetFps !== 'undefined') targetFps = parseInt(document.getElementById('fps-select').value);
            snakes = Array.from({ length: snakeCount }, () => new DemoSnake());
        });
    }

    // Tombol Mulai Gerak Game
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.onclick = () => {
            if (typeof sounds !== 'undefined' && sounds.start) sounds.start();

            let el = document.documentElement;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
                else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
                try { if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(e=>{}); } } catch(e){}
            }

            document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
            isPlaying = true;
            
            if (typeof Game !== 'undefined') {
                if(hardwareGame && hardwareGame.stopLoop) hardwareGame.stopLoop();
                const selectedMap = localStorage.getItem('snakeArena_map') || 'CYBER';
                hardwareGame = new Game('gameCanvas', selectedMap);
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
                hardwareGame.start();
                
                setTimeout(() => { resize(); }, 500);
            }
        };
    }

    // AUDIO AUTO-UNLOCK SYSTEM
    const initAudio = () => {
        if (typeof sounds !== 'undefined' && sounds.start) sounds.start();
        window.removeEventListener('mousedown', initAudio); 
        window.removeEventListener('keydown', initAudio);
        window.removeEventListener('touchstart', initAudio); 
    };
    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio); 
    window.addEventListener('touchstart', initAudio); 
    
    requestAnimationFrame(animate);
};

function animate(currentTime) {
    if (!isPlaying) {
        const delta = currentTime - lastFrameTime;
        const currentTargetFps = typeof targetFps !== 'undefined' ? targetFps : 60; 
        const interval = 1000 / currentTargetFps;

        if (currentTargetFps !== 0 && delta < interval) {
            requestAnimationFrame(animate);
            return;
        }
        
        lastFrameTime = currentTime - (delta % interval);

        ctx.fillStyle = 'rgba(13, 13, 20, 0.25)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        snakes.forEach(s => { 
            if(s.update) s.update(); 
            if(s.draw) s.draw(ctx); 
        });
        
        if(pCtx) {
            pCtx.fillStyle = '#050505';
            pCtx.fillRect(0, 0, 300, 150);
            if(previewSnake) {
                if(previewSnake.update) previewSnake.update();
                if(previewSnake.draw) previewSnake.draw(pCtx);
            }
        }
        requestAnimationFrame(animate);
    } else {
        if (hardwareGame && (hardwareGame.gameState === 'GAMEOVER' || hardwareGame.gameState === 'WON')) {
             isPlaying = false;
             lastFrameTime = performance.now(); 
             canvas.style.margin = '0';
             resize();
             requestAnimationFrame(animate);
        } else {
             requestAnimationFrame(animate); 
        }
    }
}