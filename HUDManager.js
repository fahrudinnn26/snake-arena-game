/**
 * HUDManager.js
 * Versi Optimasi: Anti-Overlapping HUD untuk Mobile Landscape
 */
class HUDManager {
    constructor(gameInstance) {
        this.game = gameInstance; 
        this.ctx = gameInstance.ctx;
        this.canvas = gameInstance.canvas;
    }

    renderAll() {
        const isMobile = this.canvas.width < 900 || this.canvas.height < 600;
        
        this.drawJoystick(isMobile);
        this.drawHUDList(isMobile);
        this.drawLeaderboard(isMobile);
        this.drawMinimap(isMobile);
        this.drawPowerUpStatus(isMobile);
    }

    drawHUDList(isMobile) {
        this.ctx.save();
        const hudX = 15; // Geser dikit ke kiri di HP biar gak makan tempat
        let currentY = 30; 
        const fontScale = isMobile ? 0.70 : 1; // Font lebih kecil di HP

        this.ctx.fillStyle = "#00f2ff"; 
        this.ctx.font = `bold ${20 * fontScale}px 'Share Tech Mono'`;
        this.ctx.shadowBlur = 10; 
        this.ctx.shadowColor = "#00f2ff";
        this.ctx.fillText(`[ SCORE: ${Math.floor(this.game.score)} | TIME: ${this.game.timerString} | BUILT: ${this.game.hardwareMgr.pcBuiltCount} PC ]`, hudX, currentY);
        
        currentY += 25 * fontScale;
        this.ctx.font = `bold ${16 * fontScale}px 'Share Tech Mono'`;
        this.ctx.fillText("--- ASSEMBLY MISSION LIST ---", hudX, currentY);
        
        currentY += 20 * fontScale;
        let fadeAlpha = Math.min(1.0, (this.game.introTimer || 0) / 1000); 

        for (let i = 0; i < this.game.hardwareMgr.masterList.length; i++) {
            let m = this.game.hardwareMgr.masterList[i];
            let isTarget = (i === this.game.hardwareMgr.missionIndex);
            
            if (isTarget) {
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = m.color; 
                this.ctx.shadowBlur = 10; 
                this.ctx.shadowColor = m.color;

                this.ctx.strokeRect(hudX, currentY - (14 * fontScale), 18 * fontScale, 18 * fontScale);
                this.ctx.fillRect(hudX + (4 * fontScale), currentY - (10 * fontScale), 10 * fontScale, 10 * fontScale);
                
                this.ctx.fillText(`[>] ${m.name} (${this.game.hardwareMgr.collectedCurrent}/${m.req}) <- TARGET`, hudX + (28 * fontScale), currentY);
                currentY += 18 * fontScale;
                
                if (!isMobile) {
                    this.ctx.font = "12px 'Share Tech Mono'";
                    this.ctx.fillText(`    Desc: ${m.desc}`, hudX + 28, currentY);
                    this.ctx.font = `bold ${16 * fontScale}px 'Share Tech Mono'`;
                    currentY += 20;
                } else {
                    currentY += 10; // Jarak rapat di HP
                }
            } 
            else if (this.game.introTimer > 0) {
                this.ctx.globalAlpha = Math.max(0, fadeAlpha);
                this.ctx.shadowBlur = 0;

                if (i < this.game.hardwareMgr.missionIndex) {
                    this.ctx.fillStyle = "#666"; 
                    this.ctx.fillText(`[V] ${m.name} (${m.req}/${m.req})`, hudX, currentY);
                } else {
                    this.ctx.fillStyle = "#ccc"; 
                    this.ctx.fillText(`[ ] ${m.name} (0/${m.req})`, hudX, currentY);
                }
                currentY += 22 * fontScale;
            }
        }
        this.ctx.restore();
    }

    drawMinimap(isMobile) {
        this.ctx.save();
        // FIX: Ukuran Minimap dikecilkan di HP biar gak nabrak Sprint
        const mapW = isMobile ? 100 : 200;
        const mapH = isMobile ? 100 : 200;
        
        // Posisikan Map di Kanan Atas (di bawah tombol Pause)
        const mapX = this.canvas.width - mapW - 15; 
        const mapY = isMobile ? 65 : 360; 
        
        this.ctx.fillStyle = "rgba(10, 10, 15, 0.7)"; 
        this.ctx.strokeStyle = "#00f2ff"; 
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapW, mapH); 
        this.ctx.fillRect(mapX, mapY, mapW, mapH);

        const scaleX = mapW / this.game.worldW;
        const scaleY = mapH / this.game.worldH;

        this.ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        this.game.obstacles.forEach(o => {
            if (o.type === 'FIREWALL') {
                this.ctx.fillRect(mapX + (o.x * scaleX), mapY + (o.y * scaleY), o.w * scaleX, o.h * scaleY);
            }
        });

        const currentTarget = this.game.hardwareMgr.getCurrentTarget();
        const timePulse = Date.now() / 150;

        this.game.hardwareMgr.activeComponents.forEach(comp => {
            let isTarget = (!comp.isMalware && currentTarget && comp.data.name === currentTarget.name);

            if (isTarget) {
                let pulse = Math.abs(Math.sin(timePulse)) * 4;
                this.ctx.fillStyle = comp.data.color;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = comp.data.color;
                this.ctx.fillRect(mapX + (comp.x * scaleX) - (3 + pulse/2), mapY + (comp.y * scaleY) - (3 + pulse/2), 6 + pulse, 6 + pulse);
                this.ctx.shadowBlur = 0; 
            } else if (comp.isMalware) {
                this.ctx.fillStyle = "#ff0000";
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillRect(mapX + (comp.x * scaleX) - 2, mapY + (comp.y * scaleY) - 2, 4, 4);
                this.ctx.globalAlpha = 1.0;
            } else {
                this.ctx.fillStyle = "rgba(100, 100, 100, 0.5)"; 
                this.ctx.fillRect(mapX + (comp.x * scaleX) - 1.5, mapY + (comp.y * scaleY) - 1.5, 3, 3);
            }
        });

        const drawMapCrown = (cx, cy) => {
            this.ctx.fillStyle = "#FFD700";
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 3, cy - 3);
            this.ctx.lineTo(cx - 4, cy - 6);
            this.ctx.lineTo(cx - 1.5, cy - 4);
            this.ctx.lineTo(cx, cy - 7);
            this.ctx.lineTo(cx + 1.5, cy - 4);
            this.ctx.lineTo(cx + 4, cy - 6);
            this.ctx.lineTo(cx + 3, cy - 3);
            this.ctx.closePath();
            this.ctx.fill();
        };

        this.game.bots.forEach(b => {
            let bColor = b.color;
            if (b.powers['UNDERVOLT'] > 0) bColor = "#00ffff"; 
            if (b.powers['OVERCLOCK'] > 0) bColor = "#ffaa00"; 

            this.ctx.fillStyle = bColor;
            let drawX = mapX + (b.x * scaleX);
            let drawY = mapY + (b.y * scaleY);
            
            this.ctx.beginPath();
            this.ctx.arc(drawX, drawY, isMobile ? 1.5 : 2.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (b.isKing) drawMapCrown(drawX, drawY);
        });

        let pColor = (typeof COLORS !== 'undefined' && typeof playerColorIdx !== 'undefined') ? COLORS[playerColorIdx] : "#00f2ff";
        if (this.game.player.powers['RADAR'] > 0) pColor = "#39ff14";
        if (this.game.player.powers['MAGNET'] > 0) pColor = "#bc13fe";
        if (this.game.player.powers['UNDERVOLT'] > 0) pColor = "#00ffff"; 
        if (this.game.player.powers['OVERCLOCK'] > 0) pColor = "#ffaa00"; 
        
        if (this.game.player.powers['RAMPAGE'] > 0) {
            pColor = `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`;
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowBlur = 5;
        }

        this.ctx.fillStyle = pColor;
        this.ctx.shadowColor = pColor;
        
        let pDrawX = mapX + (this.game.player.x * scaleX);
        let pDrawY = mapY + (this.game.player.y * scaleY);

        this.ctx.beginPath();
        this.ctx.arc(pDrawX, pDrawY, isMobile ? 2 : 4, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.game.player.isKing) drawMapCrown(pDrawX, pDrawY);

        this.ctx.restore();
    }

    drawLeaderboard(isMobile) {
        this.ctx.save(); 
        
        let lb = [{ name: this.game.player.name, score: Math.floor(this.game.score), isP: true, c: "#00f2ff", isKing: this.game.player.isKing }];
        this.game.bots.forEach(b => lb.push({ name: b.name, score: Math.floor(b.score), isP: false, c: b.color, isKing: b.isKing }));
        
        lb.sort((a, b) => b.score - a.score);
        
        let limit = isMobile ? 3 : 10;
        
        // FIX: Ukuran kotak diperkecil khusus HP biar ruang tombol Boost aman
        const lbW = isMobile ? 120 : 220;
        const lbH = isMobile ? 25 + (limit * 16) : 30 + (limit * 22);
        const lbX = this.canvas.width - lbW - 15; 
        
        // FIX: Di HP, letakkan tepat di bawah minimap (Y = 65 + 100 + 10 = 175)
        const lbY = isMobile ? 175 : 90; 

        this.ctx.fillStyle = "rgba(10, 10, 15, 0.7)"; 
        this.ctx.strokeStyle = "#00f2ff"; 
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(lbX, lbY, lbW, lbH); 
        this.ctx.fillRect(lbX, lbY, lbW, lbH);
        
        this.ctx.fillStyle = "#fff"; 
        this.ctx.font = `bold ${isMobile ? 10 : 14}px 'Share Tech Mono'`; 
        this.ctx.textAlign = "center"; 
        this.ctx.fillText("--- LEADERBOARD ---", lbX + (lbW/2), lbY + (isMobile ? 15 : 20));
        this.ctx.textAlign = "left";
        
        for(let i=0; i<limit; i++) {
            if(!lb[i]) break; 
            let rC = lb[i].isP ? "#ff007f" : "#aaa"; 
            if (lb[i].isKing) rC = "#FFD700"; 
            
            this.ctx.fillStyle = rC; 
            this.ctx.font = lb[i].isP ? `bold ${isMobile ? 10 : 12}px 'Share Tech Mono'` : `${isMobile ? 10 : 12}px 'Share Tech Mono'`;
            
            let prefix = lb[i].isKing ? "👑 " : "";
            let nameStr = lb[i].name.substring(0, isMobile ? 6 : 8); // Potong nama jika kepanjangan di HP
            
            this.ctx.fillText(`${i+1}. ${prefix}${nameStr}`, lbX + 8, lbY + (isMobile ? 32 : 45) + (i * (isMobile ? 16 : 22)));
            this.ctx.textAlign = "right"; 
            this.ctx.fillText(`${lb[i].score}`, lbX + lbW - 8, lbY + (isMobile ? 32 : 45) + (i * (isMobile ? 16 : 22))); 
            this.ctx.textAlign = "left"; 
        }
        this.ctx.restore();
    }

    drawJoystick(isMobile) { 
        if(this.game.gameState !== 'PLAYING') return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.game.joystick.baseX, this.game.joystick.baseY, this.game.joystick.radius, 0, Math.PI*2);
        this.ctx.fillStyle = "rgba(0, 242, 255, 0.1)";
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "rgba(0, 242, 255, 0.5)";
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.game.joystick.knobX, this.game.joystick.knobY, this.game.joystick.radius * 0.4, 0, Math.PI*2);
        this.ctx.fillStyle = this.game.joystick.active ? "rgba(255, 0, 127, 0.9)" : "rgba(255, 0, 127, 0.5)";
        if (this.game.joystick.active) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = "#ff007f";
        }
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPowerUpStatus(isMobile) {
        let activePowers = [];
        for (let p in this.game.player.powers) {
            if (this.game.player.powers[p] > 0) {
                activePowers.push({ type: p, time: this.game.player.powers[p] });
            }
        }

        if (activePowers.length === 0) return;

        this.ctx.save();
        const cx = this.canvas.width / 2;
        const cy = isMobile ? 25 : this.canvas.height - 50; // Lebih rapat ke atas untuk HP
        
        let startX = cx - ((activePowers.length - 1) * 160) / 2; 

        activePowers.forEach((pw) => {
            const secs = (pw.time / 1000).toFixed(1);
            let pCol = "#fff";
            
            if(pw.type==='OVERCLOCK') pCol = '#ffaa00';
            else if(pw.type==='UNDERVOLT') pCol = '#00ffff';
            else if(pw.type==='MAGNET') pCol = '#bc13fe';
            else if(pw.type==='RADAR') pCol = '#39ff14';
            else if(pw.type==='RAMPAGE') pCol = `hsl(${(Date.now() / 10) % 360}, 100%, 50%)`; 
            else if(pw.type==='SPRINT') pCol = '#ff007f'; 
            
            this.ctx.translate(startX, cy);
            
            this.ctx.beginPath(); this.ctx.moveTo(0, -10); this.ctx.lineTo(10, 0); this.ctx.lineTo(0, 10); this.ctx.lineTo(-10, 0); this.ctx.closePath();
            this.ctx.fillStyle = "rgba(0,0,0,0.8)"; this.ctx.fill(); 
            this.ctx.lineWidth = 2; this.ctx.strokeStyle = pCol; 
            this.ctx.shadowBlur = 15; this.ctx.shadowColor = pCol; this.ctx.stroke();
            this.ctx.fillStyle = pCol; this.ctx.globalAlpha = 0.5; this.ctx.fill();
            
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = pCol; 
            this.ctx.font = "bold 14px 'Share Tech Mono'";
            this.ctx.textAlign = "center";
            this.ctx.fillText(`[ ${pw.type}: ${secs}s ]`, 0, 25);

            this.ctx.translate(-startX, -cy);
            startX += 160; 
        });

        this.ctx.restore();
    }
}