/**
 * Game.js - Grand Plan Final Edition (FULLSCREEN & RESPONSIVE ALL DEVICES + DYNAMIC CAMERA)
 */

class PowerItem {
    constructor(worldW, worldH, obstacles, gfxLevel) {
        this.worldW = worldW; this.worldH = worldH; this.gfxLevel = gfxLevel;
        const types = [
            { t: 'OVERCLOCK', c: '#ffaa00', l: '⚡ SPD' },
            { t: 'UNDERVOLT', c: '#00ffff', l: '❄️ SLOW' },
            { t: 'MAGNET', c: '#bc13fe', l: '🧲 PULL' },
            { t: 'RADAR', c: '#39ff14', l: '👁️ ZOOM' }
        ];
        let rand = types[Math.floor(Math.random() * types.length)];
        this.type = rand.t; this.color = rand.c; this.label = rand.l;
        this.r = 20; this.phase = Math.random() * Math.PI * 2;
        this.spawn(obstacles);
    }
    spawn(obstacles) {
        let safe = false; let att = 0;
        while (!safe && att < 50) {
            this.x = 300 + Math.random() * (this.worldW - 600); 
            this.y = 300 + Math.random() * (this.worldH - 600);
            if (Math.hypot(this.x - 2500, this.y - 2500) < 600) { att++; continue; } 
            safe = true;
            for(let obs of obstacles) {
                let ox = obs.type === 'FIREWALL' ? obs.x + obs.w/2 : obs.x; 
                let oy = obs.type === 'FIREWALL' ? obs.y + obs.h/2 : obs.y;
                let rad = obs.type === 'FIREWALL' ? Math.max(obs.w, obs.h) : obs.r;
                if (Math.hypot(this.x - ox, this.y - oy) < rad + 150) { safe = false; break; }
            }
            att++;
        }
    }
    draw(ctx) {
        this.phase += 0.05; const floatY = Math.sin(this.phase) * 8; 
        ctx.save(); ctx.translate(this.x, this.y + floatY);
        ctx.beginPath(); ctx.moveTo(0, -this.r); ctx.lineTo(this.r, 0); ctx.lineTo(0, this.r); ctx.lineTo(-this.r, 0); ctx.closePath();
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fill(); 
        ctx.lineWidth = 3; ctx.strokeStyle = this.color; 
        ctx.shadowBlur = this.gfxLevel >= 10 ? 15 + Math.sin(this.phase * 3) * 10 : 0; 
        ctx.shadowColor = this.color; ctx.stroke();
        ctx.fillStyle = this.color; ctx.globalAlpha = 0.3; ctx.fill();
        ctx.globalAlpha = 1.0; ctx.font = "bold 11px 'Share Tech Mono'"; ctx.textAlign = "center"; ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff"; ctx.fillText(this.label, 0, this.r + 20); 
        ctx.restore();
    }
}

class Game {
    constructor(canvasId, mapTheme = 'CYBER') {
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d'); 
        
        this.gfxLevel = parseInt(document.getElementById('graphic-select')?.value || 10); 
        this.targetFps = parseInt(document.getElementById('fps-select')?.value || 60); 
        this.worldW = 5000; 
        this.worldH = 5000;
        
        this.diffMult = 1.5; 
        this.baseDiffMult = 1.5; 
        this.currentLevelName = "CORE i5 (NORMAL)";
        this.highScore = 0; 
        this.cameraScale = 1.0; 
        this.mapTheme = mapTheme;

        this.keys = {};
        this.joystick = { baseX: 150, baseY: this.canvas.height - 150, knobX: 150, knobY: this.canvas.height - 150, radius: 100, active: false, angle: null };

        this.vfx = new VFXManager(this.worldW, this.worldH, this.gfxLevel, this.mapTheme);

        this.generateObstacles();
        this.player = new Player(this.diffMult, this.gfxLevel); 
        this.hardwareMgr = new HardwareManager(this.worldW, this.worldH, this.gfxLevel);
        this.hardwareMgr.spawnMap(this.obstacles);
        
        if (typeof HUDManager !== 'undefined') {
            this.hudManager = new HUDManager(this);
        }
        
        this.bots = []; 
        this.powerItems = []; 
        this.fragments = [];

        this.score = 0; 
        this.gameState = 'MENU'; 
        this.lastTime = performance.now(); 
        this.timeAccumulator = 0; 
        this.renderAccumulator = 0; 
        this.timeElapsed = 0; 
        this.totalPausedTime = 0; 
        this.pauseStartTime = 0; 
        this.gameStartTime = 0; 
        this.timerString = "00:00";
        this.countdownValue = 3; 

        this.bgMusic = document.getElementById('bgMusic'); 
        this.gameMusic = document.getElementById('gameMusic');  
        this.winMusic = document.getElementById('winMusic'); 
        this.loseMusic = document.getElementById('loseMusic');  

        this.resize(); 
        this.setupInputs(); 
        this.setupUIButtons();
        
        this.animationId = requestAnimationFrame((time) => this.loop(time));
    }

    stopLoop() {
        cancelAnimationFrame(this.animationId);
    }

    setupUIButtons() {
        const cloneAndReplace = (id) => {
            let el = document.getElementById(id);
            if (!el) return null;
            let clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
            return clone;
        };

        const btnMulai = cloneAndReplace('btn-mulai');
        if(btnMulai) {
            btnMulai.addEventListener('click', () => {
                let el = document.documentElement;
                if (el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
                else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
                try { if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(e=>{}); } } catch(e){}

                const modalPre = document.getElementById('pre-game-modal');
                if(modalPre) modalPre.style.display = 'none';
                this.showDifficultySelector();
                
                setTimeout(() => { this.resize(); }, 500);
            });
        }

        const btnPanduan = cloneAndReplace('btn-panduan-ingame');
        if(btnPanduan) {
            btnPanduan.addEventListener('click', () => {
                document.getElementById('gameCanvas').style.display = 'none';
                const modalPre = document.getElementById('pre-game-modal');
                if(modalPre) modalPre.style.display = 'none';
                document.getElementById('main-menu').classList.remove('active');
                document.getElementById('guide-menu').classList.add('active');
                if(typeof isPlaying !== 'undefined') isPlaying = false; 
            });
        }

        cloneAndReplace('btn-menu-ingame')?.addEventListener('click', () => location.reload());
        cloneAndReplace('btn-pause-game')?.addEventListener('click', () => { 
            if (this.gameState === 'PLAYING') this.pauseGame(); 
        });
        cloneAndReplace('btn-resume-game')?.addEventListener('click', () => this.resumeGame());
        
        const reloadAction = () => { 
            try {
                if(this.gameMusic) this.gameMusic.pause(); 
                if(this.loseMusic) this.loseMusic.pause(); 
                if(this.winMusic) this.winMusic.pause();
            } catch(e) {}
            location.reload(); 
        };
        
        cloneAndReplace('btn-quit-game')?.addEventListener('click', reloadAction);
        cloneAndReplace('btn-win-replay')?.addEventListener('click', reloadAction);
        cloneAndReplace('btn-win-menu')?.addEventListener('click', reloadAction);
        cloneAndReplace('btn-lose-replay')?.addEventListener('click', reloadAction);
        cloneAndReplace('btn-lose-menu')?.addEventListener('click', reloadAction);
    }

    showDifficultySelector() {
        if (document.getElementById('diff-modal')) return; 

        const div = document.createElement('div');
        div.id = 'diff-modal';
        div.style.cssText = "position:absolute; top:0; left:0; width:100vw; height:100dvh; background:rgba(0,0,0,0.9); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#00f2ff; font-family:'Share Tech Mono', monospace; backdrop-filter:blur(5px);";
        
        div.innerHTML = `
            <h1 style="font-size:3rem; margin-bottom:20px; text-shadow:0 0 20px #00f2ff; text-align:center;">SELECT CPU POWER</h1>
            <div style="display:flex; gap:15px; flex-wrap: wrap; justify-content: center; max-width: 800px; padding: 20px;">
                <button class="diff-btn" data-val="1" style="padding:15px 25px; background:rgba(0,255,255,0.1); border:2px solid #00f2ff; color:#fff; cursor:pointer; font-size:1.1rem; font-family:inherit;">CORE i3 (EASY)</button>
                <button class="diff-btn" data-val="1.5" style="padding:15px 25px; background:rgba(0,255,255,0.1); border:2px solid #00f2ff; color:#fff; cursor:pointer; font-size:1.1rem; font-family:inherit;">CORE i5 (NORMAL)</button>
                <button class="diff-btn" data-val="2" style="padding:15px 25px; background:rgba(0,255,255,0.1); border:2px solid #00f2ff; color:#fff; cursor:pointer; font-size:1.1rem; font-family:inherit;">CORE i7 (HARD)</button>
                <button class="diff-btn" data-val="3" style="padding:15px 25px; background:rgba(255,0,127,0.1); border:2px solid #ff007f; color:#ff007f; cursor:pointer; font-size:1.1rem; font-family:inherit; text-shadow: 0 0 5px #ff007f;">CORE i9 (EXTREME)</button>
            </div>
        `;
        document.body.appendChild(div);
        
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.onclick = () => {
                let el = document.documentElement;
                if (el.requestFullscreen) { el.requestFullscreen().catch(e=>{}); }
                else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }

                const val = parseFloat(btn.getAttribute('data-val'));
                document.body.removeChild(div);
                this.startGameplay(val); 
                
                setTimeout(() => { this.resize(); }, 500);
            };
        });
    }

    startGameplay(selectedDifficulty) {
        if (this.gameState === 'COUNTDOWN' || this.gameState === 'PLAYING') return;

        this.diffMult = isNaN(selectedDifficulty) ? 1.5 : selectedDifficulty;
        this.baseDiffMult = this.diffMult; 
        
        if(this.diffMult === 1) this.currentLevelName = "CORE i3 (EASY)";
        else if(this.diffMult === 1.5) this.currentLevelName = "CORE i5 (NORMAL)";
        else if(this.diffMult === 2) this.currentLevelName = "CORE i7 (HARD)";
        else if(this.diffMult === 3) this.currentLevelName = "CORE i9 (EXTREME)";

        this.highScore = parseInt(localStorage.getItem(`snakeArena_HS_${this.baseDiffMult}`)) || 0;

        this.vfx = new VFXManager(this.worldW, this.worldH, this.gfxLevel, this.mapTheme);

        this.player = new Player(this.diffMult, this.gfxLevel); 
        this.hardwareMgr = new HardwareManager(this.worldW, this.worldH, this.gfxLevel);
        
        this.hardwareMgr.reset(); 
        this.hardwareMgr.spawnMap(this.obstacles);
        
        this.bots = []; 
        const botCount = Math.floor(this.diffMult * 12) || 12; 
        for(let i=0; i < botCount; i++) {
            this.bots.push(new BotSnake(this.worldW, this.worldH, i%2===0?"#ff007f":"#ffaa00", i, this.gfxLevel, this.diffMult, i === 0));
        }

        this.powerItems = [];
        for(let i=0; i<4; i++) {
            this.powerItems.push(new PowerItem(this.worldW, this.worldH, this.obstacles, this.gfxLevel));
        }

        this.fragments = [];
        this.score = 0; 
        this.timerString = "00:00"; 
        this.introTimer = 4000;

        const btnPause = document.getElementById('btn-pause-game');
        if (btnPause) btnPause.style.display = 'block';

        const btnSprint = document.getElementById('btn-sprint');
        if (btnSprint) btnSprint.style.display = 'block';
        
        const loseModal = document.getElementById('lose-modal');
        if(loseModal) {
            loseModal.style.boxShadow = "none";
            loseModal.style.border = "1px solid #ff007f";
        }

        this.startCountdown();
    }

    pauseGame() { 
        this.gameState = 'PAUSED'; 
        this.pauseStartTime = Date.now(); 
        document.getElementById('pause-modal').style.display = 'flex'; 
        document.getElementById('btn-pause-game').style.display = 'none'; 
        document.getElementById('btn-sprint').style.display = 'none'; 
        this.joystick.active = false; 
        if(this.gameMusic) this.gameMusic.volume = 0.2; 
    }
    
    resumeGame() { 
        document.getElementById('pause-modal').style.display = 'none'; 
        document.getElementById('btn-pause-game').style.display = 'block'; 
        document.getElementById('btn-sprint').style.display = 'block'; 
        this.totalPausedTime += (Date.now() - this.pauseStartTime); 
        this.lastTime = performance.now(); 
        this.gameState = 'PLAYING'; 
        if(this.gameMusic) this.gameMusic.volume = 0.5; 
    }

    startCountdown() {
        this.gameState = 'COUNTDOWN'; 
        this.countdownValue = 3;
        
        const countInterval = setInterval(() => {
            this.countdownValue--;
            if (this.countdownValue < 0) {
                clearInterval(countInterval); 
                
                this.gameState = 'PLAYING'; 
                this.gameStartTime = Date.now(); 
                this.totalPausedTime = 0; 
                
                try {
                    if(this.bgMusic) this.bgMusic.pause();
                    if(this.gameMusic) { 
                        this.gameMusic.currentTime = 0; 
                        this.gameMusic.play().catch(e => console.log("Audio muted")); 
                    }
                } catch(e) {}
            }
        }, 1000);
    }

    updateTimer() {
        if (this.gameState === 'PLAYING') {
            const sec = Math.floor((Date.now() - this.gameStartTime - this.totalPausedTime) / 1000);
            this.timerString = `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
        }
    }

    generateObstacles() {
        this.obstacles = []; 
        const count = Math.floor(this.diffMult * 25) || 25; 
        for (let i = 0; i < count; i++) {
            let type = Math.random() > 0.5 ? 'FIREWALL' : 'BAD_SECTOR';
            let safe = false, att = 0, nx, ny;
            let nw = type==='FIREWALL' ? 150+Math.random()*150 : 0;
            let nh = type==='FIREWALL' ? 60+Math.random()*80 : 0;
            let nr = type==='BAD_SECTOR' ? 70+Math.random()*60 : 0;
            
            while (!safe && att < 50) {
                nx = 300 + Math.random() * (this.worldW - 600); 
                ny = 300 + Math.random() * (this.worldH - 600);
                if (Math.hypot(nx - 2500, ny - 2500) < 600) { att++; continue; }
                
                safe = true;
                for(let obs of this.obstacles) {
                    let ox = obs.type === 'FIREWALL' ? obs.x + obs.w/2 : obs.x; 
                    let oy = obs.type === 'FIREWALL' ? obs.y + obs.h/2 : obs.y;
                    let exR = obs.type === 'FIREWALL' ? Math.max(obs.w, obs.h) : obs.r;
                    if (Math.hypot(nx - ox, ny - oy) < exR + (type==='FIREWALL'?Math.max(nw,nh):nr) + 200) { 
                        safe = false; break; 
                    }
                }
                att++;
            }
            this.obstacles.push({ type, x: nx, y: ny, w: nw, h: nh, r: nr, phase: Math.random() * Math.PI * 2 });
        }
    }

    setupInputs() {
        let isDown = false;
        const upd = (cx, cy) => {
            if (this.gameState !== 'PLAYING') return; 
            const rect = this.canvas.getBoundingClientRect(); 
            const mx = cx - rect.left; 
            const my = cy - rect.top;
            
            if (!isDown) { 
                this.joystick.active = false; 
                this.joystick.knobX = this.joystick.baseX; 
                this.joystick.knobY = this.joystick.baseY; 
                this.joystick.angle = null; 
                return; 
            }
            
            const dx = mx - this.joystick.baseX;
            const dy = my - this.joystick.baseY;
            const dist = Math.hypot(dx, dy);
            
            if (dist < this.joystick.radius * 2.5 || this.joystick.active) {
                this.joystick.active = true; 
                this.joystick.angle = Math.atan2(dy, dx);
                if (dist > this.joystick.radius) { 
                    this.joystick.knobX = this.joystick.baseX + Math.cos(this.joystick.angle) * this.joystick.radius; 
                    this.joystick.knobY = this.joystick.baseY + Math.sin(this.joystick.angle) * this.joystick.radius; 
                } else { 
                    this.joystick.knobX = mx; 
                    this.joystick.knobY = my; 
                }
            }
        };
        
        window.addEventListener('mousedown', (e) => { isDown = true; upd(e.clientX, e.clientY); }); 
        window.addEventListener('mousemove', (e) => upd(e.clientX, e.clientY)); 
        window.addEventListener('mouseup', () => { isDown = false; upd(0, 0); });
        
        window.addEventListener('touchstart', (e) => { isDown = true; upd(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false}); 
        window.addEventListener('touchmove', (e) => upd(e.touches[0].clientX, e.touches[0].clientY), {passive: false}); 
        window.addEventListener('touchend', () => { isDown = false; upd(0, 0); });
        
        window.addEventListener('keydown', (e) => { if(e.code === 'Space') this.keys['Space'] = true; });
        window.addEventListener('keyup', (e) => { if(e.code === 'Space') this.keys['Space'] = false; });

        const btnSprint = document.getElementById('btn-sprint');
        if (btnSprint) {
            btnSprint.addEventListener('mousedown', () => this.keys['Space'] = true);
            btnSprint.addEventListener('mouseup', () => this.keys['Space'] = false);
            btnSprint.addEventListener('mouseleave', () => this.keys['Space'] = false);
            btnSprint.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys['Space'] = true; }, {passive:false});
            btnSprint.addEventListener('touchend', (e) => { e.preventDefault(); this.keys['Space'] = false; }, {passive:false});
        }

        window.addEventListener('resize', () => { 
            this.resize(); 
        });
    }

    resize() { 
        this.canvas.width = window.innerWidth; 
        this.canvas.height = window.innerHeight; 
        
        if (this.joystick) {
            const isMobile = window.innerWidth < 900 || window.innerHeight < 600;
            this.joystick.radius = isMobile ? 60 : 100;
            this.joystick.baseX = isMobile ? 90 : 150;
            this.joystick.baseY = this.canvas.height - (isMobile ? 90 : 150);
            
            if (!this.joystick.active) {
                this.joystick.knobX = this.joystick.baseX;
                this.joystick.knobY = this.joystick.baseY;
            }
        }
    }

    start() {
        const langBtn = document.querySelector('.lang-toggle-container'); 
        if(langBtn) langBtn.style.display = 'none';

        this.gameState = 'PRE_GAME'; 
        const modal = document.getElementById('pre-game-modal'); 
        if(modal) modal.style.display = 'flex';
        
        this.lastTime = performance.now(); 
        this.timeAccumulator = 0; 
        this.renderAccumulator = 0;
    }

    loop(time) {
        if (this.gameState === 'GAMEOVER' || this.gameState === 'WON') return;
        let delta = time - this.lastTime; 
        if (delta > 250) delta = 250; 
        this.lastTime = time;

        if (this.gameState === 'MENU') { 
            this.timeElapsed += 0.03; 
            this.drawMenuBackground(); 
            this.animationId = requestAnimationFrame(t => this.loop(t)); 
            return; 
        }
        
        if (this.gameState === 'PRE_GAME' || this.gameState === 'COUNTDOWN' || this.gameState === 'PAUSED') { 
            this.draw(); 
            this.animationId = requestAnimationFrame(t => this.loop(t)); 
            return; 
        }

        this.timeAccumulator += delta; 
        this.renderAccumulator += delta;
        const logicStep = 1000 / 60; 
        
        while (this.timeAccumulator >= logicStep) { 
            this.timeElapsed += 0.05; 
            this.updateTimer(); 
            this.update(logicStep); 
            this.timeAccumulator -= logicStep; 
        }
        
        const renderStep = 1000 / this.targetFps;
        if (this.renderAccumulator >= renderStep) { 
            this.draw(); 
            this.renderAccumulator = (this.renderAccumulator % renderStep); 
        }
        
        this.animationId = requestAnimationFrame(t => this.loop(t));
    }

    drawMenuBackground() {
        this.ctx.fillStyle = this.mapTheme === 'CYBER' ? "#010205" : "#020a14"; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        let tgtX = this.worldW / 2, tgtY = this.worldH / 2;
        if (this.bots && this.bots.length > 0) { tgtX = this.bots[0].x; tgtY = this.bots[0].y; }
        
        const camX = tgtX - (this.canvas.width / 2); 
        const camY = tgtY - (this.canvas.height / 2);

        this.vfx.applyShake(this.ctx);
        this.ctx.translate(-camX, -camY); 

        this.vfx.drawBackground(this.ctx, camX, camY, this.canvas.width, this.canvas.height); 
        this.vfx.drawObstacles(this.ctx, this.obstacles); 
        
        if (this.powerItems) this.powerItems.forEach(i => i.draw(this.ctx));
        if (this.bots) this.bots.forEach(b => { b.updatePosition(16, this.obstacles, this.fragments); b.draw(this.ctx); });
        this.ctx.restore();
    }

    update(delta) {
        if(!this.player) return;

        let currentKing = this.player;
        let maxScoreInMap = this.score;

        for (let b of this.bots) {
            if (b.score > maxScoreInMap) {
                maxScoreInMap = b.score;
                currentKing = b;
            }
        }
        this.player.isKing = (this.player === currentKing);
        this.bots.forEach(b => b.isKing = (b === currentKing));

        this.vfx.update(delta);

        if (this.introTimer > 0) this.introTimer -= delta;

        let isSprinting = this.keys['Space'];
        if (isSprinting && this.score > 5 && this.player.powers['RAMPAGE'] <= 0) {
            this.score -= 20 * (delta / 1000); 
            if (this.score < 0) this.score = 0;
            this.player.updateSize(this.score);
            this.player.applyPowerUp('SPRINT', 50); 
            
            if (Math.random() < 0.3) {
                const tail = this.player.segments[this.player.segments.length - 1];
                if (tail) this.vfx.particles.push(new Particle(tail.x, tail.y, "#ffffff", this.gfxLevel));
            }
        }

        this.player.updatePosition(this.joystick.angle, delta);

        if (this.player.x < 0 || this.player.x > this.worldW || this.player.y < 0 || this.player.y > this.worldH) {
            return this.gameOver("SHORT CIRCUIT! Keluar batas sirkuit arena.");
        }
        
        if (this.player.powers['MAGNET'] > 0) {
            const pullRad = 400; 
            const pSpd = 10;
            const pullLogic = (item) => {
                let d = Math.hypot(this.player.x - item.x, this.player.y - item.y);
                if(d < pullRad) { 
                    let ang = Math.atan2(this.player.y - item.y, this.player.x - item.x); 
                    item.x += Math.cos(ang) * pSpd; 
                    item.y += Math.sin(ang) * pSpd; 
                }
            };
            this.powerItems.forEach(pullLogic);
            this.fragments.forEach(pullLogic);
            
            let currentMission = this.hardwareMgr.getCurrentTarget();
            if(currentMission) {
                this.hardwareMgr.activeComponents.forEach(comp => {
                    if(!comp.isMalware && comp.data.name === currentMission.name) {
                        pullLogic(comp);
                    }
                });
            }
        }

        for(let i=0; i<this.powerItems.length; i++) {
            let item = this.powerItems[i];
            if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 30) {
                this.player.applyPowerUp(item.type, 7000); 
                this.vfx.createExplosion(item.x, item.y, item.color, 30);
                this.vfx.addScorePopup(item.type, item.color, this.player.x, this.player.y - 20);
                this.powerItems[i] = new PowerItem(this.worldW, this.worldH, this.obstacles, this.gfxLevel);
                if(typeof sounds !== 'undefined') sounds.playPowerUp();
            }
        }

        for(let i=this.fragments.length-1; i>=0; i--) {
            let frag = this.fragments[i];
            if (frag.update) frag.update(delta);
            
            if (frag.life <= 0) {
                this.fragments.splice(i, 1);
                continue;
            }

            if (Math.hypot(this.player.x - frag.x, this.player.y - frag.y) < 25) {
                if(frag.onCollected()) {
                    this.score += 25;
                    this.player.updateSize(this.score); 
                    this.vfx.createExplosion(frag.x, frag.y, frag.color, 5);
                    this.fragments.splice(i, 1);
                    if(typeof sounds !== 'undefined') sounds.playEat();
                }
            }
        }

        const isRampageActive = this.player.powers['RAMPAGE'] > 0;

        for (let bot of this.bots) {
            bot.updatePosition(delta, this.obstacles, this.fragments); 
            
            let botDied = false;
            let hitPlayerBody = false;
            
            for (let obs of this.obstacles) {
                if (obs.type === 'FIREWALL' && bot.x > obs.x && bot.x < obs.x+obs.w && bot.y > obs.y && bot.y < obs.y+obs.h) botDied = true;
                else if (obs.type === 'BAD_SECTOR' && Math.hypot(bot.x - obs.x, bot.y - obs.y) < obs.r) botDied = true;
            }

            for(let i=0; i<this.powerItems.length; i++) {
                let item = this.powerItems[i];
                if (Math.hypot(bot.x - item.x, bot.y - item.y) < 30) {
                    bot.applyPowerUp(item.type, 7000); 
                    this.vfx.createExplosion(item.x, item.y, item.color, 20);
                    this.powerItems[i] = new PowerItem(this.worldW, this.worldH, this.obstacles, this.gfxLevel);
                }
            }
            
            for(let i=this.fragments.length-1; i>=0; i--) {
                let frag = this.fragments[i];
                if (Math.hypot(bot.x - frag.x, bot.y - frag.y) < 25) {
                    if(frag.onCollected()) {
                        bot.score += 25;
                        bot.updateSize(bot.score); 
                        this.vfx.createExplosion(frag.x, frag.y, frag.color, 5);
                        this.fragments.splice(i, 1);
                    }
                }
            }
            
            if (!botDied) {
                for (let i = 0; i < this.player.segments.length; i++) {
                    if (Math.hypot(bot.x - this.player.segments[i].x, bot.y - this.player.segments[i].y) < 15) { 
                        botDied = true; 
                        hitPlayerBody = true; 
                        break; 
                    }
                }
            }

            if (!botDied) {
                for (let otherBot of this.bots) {
                    if (otherBot !== bot) { 
                        for (let i = 0; i < otherBot.segments.length; i++) {
                            if (Math.hypot(bot.x - otherBot.segments[i].x, bot.y - otherBot.segments[i].y) < 15) {
                                botDied = true;
                                break;
                            }
                        }
                    }
                    if(botDied) break;
                }
            }

            if (!botDied) {
                for (let i = 0; i < bot.segments.length; i++) {
                    if (Math.hypot(this.player.x - bot.segments[i].x, this.player.y - bot.segments[i].y) < 15) {
                        if (isRampageActive) {
                            botDied = true;
                            hitPlayerBody = true;
                            break; 
                        } else {
                            return this.gameOver("CRASH! Menabrak sistem keamanan bot.");
                        }
                    }
                }
            }
            
            if (botDied) {
                this.vfx.createExplosion(bot.x, bot.y, bot.color, 40);
                if (hitPlayerBody) this.vfx.triggerShake(15, 300); 

                for(let seg of bot.segments) { 
                    if(Math.random() > 0.4) this.fragments.push(new DataFragment(seg.x, seg.y, bot.color, this.gfxLevel)); 
                }
                this.vfx.addScorePopup("BOT KILLED", "#ff007f", bot.x, bot.y);
                
                let dist = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
                if(typeof sounds !== 'undefined') sounds.playBotCrash(dist);
                
                bot.reset();
                continue;
            }
        }

        const isCyber = this.mapTheme === 'CYBER';

        for (let obs of this.obstacles) {
            if (obs.type === 'FIREWALL' && this.player.x > obs.x && this.player.x < obs.x+obs.w && this.player.y > obs.y && this.player.y < obs.y+obs.h) {
                return this.gameOver(isCyber ? "SYSTEM BREACH! Menabrak Firewall dinding." : "FROST SHATTER! Menabrak Balok Frozen Wall.");
            }
            else if (obs.type === 'BAD_SECTOR' && Math.hypot(this.player.x - obs.x, this.player.y - obs.y) < obs.r) {
                return this.gameOver(isCyber ? "CORRUPTED! Memasuki area Bad Sector terlarang." : "FROZEN CORE! Sistem membeku di dalam Cryo Leak.");
            }
        }

        for (let i = this.hardwareMgr.activeComponents.length - 1; i >= 0; i--) {
            let comp = this.hardwareMgr.activeComponents[i];
            
            if (Math.hypot(this.player.x - comp.x, this.player.y - comp.y) < 35) {
                if (comp.isMalware) {
                    if (isRampageActive) {
                        this.score += 500;
                        this.player.updateSize(this.score);
                        this.vfx.createExplosion(comp.x, comp.y, "#ff0000", 50);
                        this.vfx.addScorePopup(`MALWARE DESTROYED!`, "#ff0000", this.player.x, this.player.y);
                        this.hardwareMgr.activeComponents.splice(i, 1);
                        break;
                    } else {
                        return this.gameOver("FATAL ERROR! Termakan jebakan Chip Malware.");
                    }
                }
                
                let currentMission = this.hardwareMgr.getCurrentTarget();
                if (comp.data.name !== currentMission.name) {
                    return this.gameOver(`WRONG ASSEMBLY ORDER! Harusnya pasang ${currentMission.short} dulu!`);
                }

                let collectedObj = comp.onCollected();
                if (collectedObj) {
                    this.hardwareMgr.collectedCurrent++;
                    this.score += 200; 
                    this.player.updateSize(this.score); 
                    
                    this.vfx.createExplosion(comp.x, comp.y, comp.data.color, 50);
                    this.vfx.addScorePopup(`+200 ${comp.data.short} INSTALLED`, comp.data.color, this.player.x, this.player.y);
                    if(typeof sounds !== 'undefined') sounds.playEat();

                    if (this.hardwareMgr.collectedCurrent >= currentMission.req) {
                        this.hardwareMgr.missionIndex++;
                        this.hardwareMgr.collectedCurrent = 0;

                        if (this.hardwareMgr.missionIndex >= this.hardwareMgr.masterList.length) {
                            this.score += 5000;
                            this.player.updateSize(this.score);
                            this.vfx.addScorePopup("SYSTEM BUILT! +5000", "#00f2ff", this.player.x, this.player.y - 50);
                            
                            this.player.applyPowerUp('RAMPAGE', 10000); 
                            this.vfx.addScorePopup("RAMPAGE MODE ACTIVE!", "#ff0000", this.player.x, this.player.y - 80);
                            
                            if(typeof sounds !== 'undefined') sounds.playRampage();

                            this.hardwareMgr.pcBuiltCount++;
                            this.hardwareMgr.missionIndex = 0; 
                            this.introTimer = 4000; 
                            this.diffMult += 0.2; 
                            
                            this.bots.push(new BotSnake(this.worldW, this.worldH, "#ff007f", this.bots.length, this.gfxLevel, this.diffMult));
                        }
                    }
                    this.hardwareMgr.spawnMap(this.obstacles); 
                    break; 
                }
            }
        }
    }

    draw() {
        if(!this.player) return; 

        // ====================================================
        // FIX: MAGIC CAMERA ZOOM!
        // Deteksi apakah sedang di HP (Layar Kecil)
        // ====================================================
        let isMobile = window.innerWidth < 900 || window.innerHeight < 600;
        
        // Base scale: PC = 1.0, Mobile = 0.55 (Zoom out otomatis biar luas di HP)
        let baseZoom = isMobile ? 0.55 : 1.0;
        
        // Kalau dapat item RADAR, zoom out lebih jauh lagi
        const tgtScale = this.player.powers['RADAR'] > 0 ? (baseZoom * 0.6) : baseZoom; 
        
        this.cameraScale += (tgtScale - this.cameraScale) * 0.05; 

        const camX = this.player.x - (this.canvas.width / 2) / this.cameraScale;
        const camY = this.player.y - (this.canvas.height / 2) / this.cameraScale;

        this.ctx.fillStyle = this.mapTheme === 'CYBER' ? "#010205" : "#020a14"; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        
        this.vfx.applyShake(this.ctx);

        this.ctx.scale(this.cameraScale, this.cameraScale);
        this.ctx.translate(-camX, -camY); 

        this.vfx.drawBackground(this.ctx, camX, camY, this.canvas.width / this.cameraScale, this.canvas.height / this.cameraScale); 
        this.vfx.drawObstacles(this.ctx, this.obstacles);
        
        this.powerItems.forEach(i => i.draw(this.ctx));
        this.fragments.forEach(f => f.draw(this.ctx));
        this.hardwareMgr.draw(this.ctx);
        this.bots.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx);

        this.vfx.drawParticlesAndPopups(this.ctx);
        this.ctx.restore();
        
        this.vfx.drawVignette(this.ctx, this.canvas.width, this.canvas.height); 
        
        if (typeof HUDManager !== 'undefined' && this.hudManager) {
            this.hudManager.renderAll();
        }

        if (this.gameState === 'COUNTDOWN') {
            this.ctx.save();
            this.ctx.fillStyle = "rgba(0,0,0,0.7)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.countdownValue > 0 ? "#39ff14" : "#00f2ff";
            this.ctx.font = "bold 12rem 'Share Tech Mono', monospace";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.shadowBlur = 40;
            this.ctx.shadowColor = this.ctx.fillStyle;
            let text = this.countdownValue > 0 ? this.countdownValue : "START!";
            this.ctx.fillText(text, this.canvas.width/2, this.canvas.height/2);
            this.ctx.restore();
        }
        
        if(this.gameState === 'PAUSED') { 
            this.ctx.fillStyle = "rgba(0,0,0,0.6)"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); 
        }
    }

    gameOver(reason) {
        this.gameState = 'GAMEOVER'; 
        document.getElementById('btn-pause-game').style.display = 'none'; 
        document.getElementById('btn-sprint').style.display = 'none'; 
        
        let isNewHighScore = false;
        
        if(Math.floor(this.score) > this.highScore) {
            localStorage.setItem(`snakeArena_HS_${this.baseDiffMult}`, Math.floor(this.score)); 
            isNewHighScore = true;
        }

        let currentMaxPC = parseInt(localStorage.getItem(`snakeArena_PC_${this.baseDiffMult}`)) || 0;
        if (this.hardwareMgr.pcBuiltCount > currentMaxPC) {
            localStorage.setItem(`snakeArena_PC_${this.baseDiffMult}`, this.hardwareMgr.pcBuiltCount);
        }

        localStorage.setItem('snakeArena_lastScore', Math.floor(this.score));
        localStorage.setItem('snakeArena_lastPCs', this.hardwareMgr.pcBuiltCount);
        localStorage.setItem('snakeArena_lastLevel', this.currentLevelName);
        
        try {
            if(this.gameMusic) { this.gameMusic.pause(); this.gameMusic.currentTime = 0; }
            if(this.loseMusic) { this.loseMusic.currentTime = 0; this.loseMusic.play().catch(e=>{}); }
        } catch(e) {}
        
        setTimeout(() => { 
            const loseTitle = document.getElementById('lose-title');
            const loseBox = document.getElementById('lose-box');
            const loseReason = document.getElementById('txt-lose-reason');
            const loseModal = document.getElementById('lose-modal');

            loseTitle.innerText = "CRITICAL FAILURE!";
            loseTitle.style.color = "#ff007f";
            loseTitle.style.textShadow = "0 0 30px #ff007f";

            loseBox.style.border = "1px solid #ff007f";
            loseBox.style.boxShadow = "0 0 30px rgba(255, 0, 127, 0.3)";
            loseBox.style.background = "rgba(255, 0, 127, 0.1)";

            loseReason.innerHTML = `<span style="color:#ffaa00;"><strong>[ SYSTEM REPORT ]</strong></span><br><br>${reason}`; 
            
            document.getElementById('txt-lose-score').innerText = Math.floor(this.score); 
            document.getElementById('txt-lose-pc').innerText = this.hardwareMgr.pcBuiltCount; 
            document.getElementById('txt-lose-time').innerText = this.timerString; 
            
            loseModal.style.display = 'flex'; 

            if (isNewHighScore) {
                setTimeout(() => {
                    try {
                        if(this.loseMusic) this.loseMusic.pause();
                        if(this.winMusic) { this.winMusic.currentTime = 0; this.winMusic.play().catch(e=>{}); }
                    } catch(e) {}
                    
                    loseTitle.innerText = "🎉 NEW HIGH SCORE! 🎉";
                    loseTitle.style.color = "#ffaa00";
                    loseTitle.style.textShadow = "0 0 40px #ffaa00, 0 0 80px #ffff00";

                    loseBox.style.border = "3px solid #ffaa00";
                    loseBox.style.boxShadow = "0 0 60px rgba(255, 170, 0, 0.6)";
                    loseBox.style.background = "rgba(255, 170, 0, 0.2)";

                    loseReason.innerHTML = `<span style="color:#39ff14; font-size:1.3rem;"><strong>[ DATA OVERRIDDEN ]</strong></span><br>Rekor sistem berhasil dipecahkan!`;

                    for(let i=0; i<6; i++) {
                        setTimeout(() => {
                            this.vfx.createExplosion(this.player.x + (Math.random()*300-150), this.player.y + (Math.random()*300-150), "#ffaa00", 60);
                            this.vfx.createExplosion(this.player.x + (Math.random()*300-150), this.player.y + (Math.random()*300-150), "#ffff00", 60);
                            this.vfx.createExplosion(this.player.x + (Math.random()*300-150), this.player.y + (Math.random()*300-150), "#39ff14", 60);
                            this.vfx.triggerShake(10, 200);
                        }, i * 400); 
                    }
                }, 2000); 
            }
        }, 100);
    }
}