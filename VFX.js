/**
 * VFX.js - Visual Effects & Rendering Engine
 * DUAL THEME ENGINE: CYBERBOARD & CRYO COOLING
 */

class ScorePopup {
    constructor(text, color, x, y, gfxLevel) {
        this.text = text; this.color = color; this.x = x; this.y = y;
        this.opacity = 1.0; this.speedY = -4; this.scale = 2.0; this.gfxLevel = gfxLevel;
    }
    update(delta) { 
        this.speedY *= 0.9; 
        this.y += this.speedY * (delta/16); 
        this.opacity -= 0.015 * (delta/16); 
        if (this.scale > 1.0) this.scale -= 0.08 * (delta/16); 
    }
    draw(ctx) {
        ctx.save(); 
        ctx.globalAlpha = Math.max(0, this.opacity); 
        ctx.translate(this.x, this.y); 
        ctx.scale(this.scale, this.scale);
        ctx.fillStyle = this.color; 
        ctx.shadowBlur = this.gfxLevel >= 10 ? 15 : 0; 
        ctx.shadowColor = this.color;
        ctx.font = "bold 16px 'Share Tech Mono', monospace"; 
        ctx.textAlign = "center"; 
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, gfxLevel) {
        this.x = x; this.y = y; this.color = color; this.gfxLevel = gfxLevel;
        const ang = Math.random() * Math.PI * 2; 
        const spd = Math.random() * 8 + 2; 
        this.vx = Math.cos(ang) * spd; 
        this.vy = Math.sin(ang) * spd;
        this.life = 1.0; 
        this.decay = Math.random() * 0.02 + 0.015; 
        this.size = Math.random() * 5 + 3;
    }
    update(delta) { 
        this.vx *= 0.92; this.vy *= 0.92; 
        this.x += this.vx * (delta/16); 
        this.y += this.vy * (delta/16); 
        this.life -= this.decay * (delta/16); 
        this.size = Math.max(0, this.size - 0.1); 
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = Math.max(0, this.life); 
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.gfxLevel >= 10 ? 8 : 0; 
        ctx.shadowColor = this.color; 
        ctx.fillRect(this.x, this.y, this.size, this.size); 
        ctx.globalAlpha = 1.0; 
        ctx.shadowBlur = 0;
    }
}

class VFXManager {
    constructor(worldW, worldH, gfxLevel, mapTheme = 'CYBER') {
        this.worldW = worldW;
        this.worldH = worldH;
        this.gfxLevel = gfxLevel;
        this.mapTheme = mapTheme;
        
        this.particles = [];
        this.popups = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.matrixDrops = Array.from({length: 150}, () => ({
            x: Math.random() * worldW,
            y: Math.random() * worldH,
            speed: 0.5 + Math.random() * 1.5,
            text: Math.random() > 0.5 ? "1" : "0",
            opacity: Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2 
        }));
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) { 
            this.particles[i].update(delta); 
            if (this.particles[i].life <= 0) this.particles.splice(i, 1); 
        }
        for (let i = this.popups.length - 1; i >= 0; i--) { 
            this.popups[i].update(delta); 
            if (this.popups[i].opacity <= 0) this.popups.splice(i, 1); 
        }
        if (this.shakeTimer > 0) {
            this.shakeTimer -= delta;
        }

        this.matrixDrops.forEach(drop => {
            drop.y += drop.speed * (delta/16);
            
            if (this.mapTheme === 'WINTER') {
                drop.x += Math.sin(drop.phase) * 0.5 * (delta/16);
                drop.phase += 0.02 * (delta/16);
            }

            if (drop.y > this.worldH) {
                drop.y = -50;
                drop.x = Math.random() * this.worldW;
                drop.text = Math.random() > 0.5 ? "1" : "0";
            }
            if (Math.random() < 0.05) drop.text = Math.random() > 0.5 ? "1" : "0"; 
        });
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    applyShake(ctx) {
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }
    }

    createExplosion(x, y, color, base = 20) {
        let amt = Math.floor(base * (this.gfxLevel / 10));
        if (amt < 1) amt = 1;
        for(let i = 0; i < amt; i++) {
            this.particles.push(new Particle(x, y, color, this.gfxLevel)); 
        }
    }

    addScorePopup(text, color, x, y) {
        this.popups.push(new ScorePopup(text, color, x, y, this.gfxLevel));
    }

    drawBackground(ctx, camX, camY, viewW, viewH) {
        const step = 80; 
        const sX = Math.max(0, Math.floor(camX/step)*step);
        const sY = Math.max(0, Math.floor(camY/step)*step);
        const eX = Math.min(this.worldW, camX+viewW+step);
        const eY = Math.min(this.worldH, camY+viewH+step);

        const time = Date.now() / 1000;
        const baseAlpha = this.gfxLevel * 0.01; 
        const isCyber = this.mapTheme === 'CYBER';

        ctx.strokeStyle = isCyber ? `rgba(0, 242, 255, ${baseAlpha})` : `rgba(200, 240, 255, ${baseAlpha * 1.5})`; 
        ctx.lineWidth = 1 + (this.gfxLevel/20);
        
        ctx.beginPath();
        for(let x=sX; x<eX; x+=step) { 
            for(let y=sY; y<eY; y+=step) { 
                ctx.moveTo(x-5, y); ctx.lineTo(x+5, y); 
                ctx.moveTo(x, y-5); ctx.lineTo(x, y+5); 
                if ((x+y) % 240 === 0) {
                    ctx.moveTo(x+2, y);
                    ctx.arc(x, y, 2, 0, Math.PI*2);
                }
            } 
        }
        ctx.stroke();

        if (this.gfxLevel >= 10) {
            if (isCyber) {
                ctx.lineWidth = 2;
                for(let x=sX; x<eX; x+=step*3) {
                    let glowY = (time * 500 + x * 10) % this.worldH;
                    if (glowY > sY - 200 && glowY < eY + 200) {
                        let grad = ctx.createLinearGradient(x, glowY, x, glowY+150);
                        grad.addColorStop(0, "transparent");
                        grad.addColorStop(0.5, `rgba(0, 242, 255, ${baseAlpha * 4})`);
                        grad.addColorStop(1, "transparent");
                        ctx.strokeStyle = grad;
                        ctx.beginPath();
                        ctx.moveTo(x, glowY);
                        ctx.lineTo(x, glowY+150);
                        ctx.stroke();
                    }
                }
            } else {
                ctx.font = "14px 'Share Tech Mono', monospace";
                ctx.textAlign = "center";
                this.matrixDrops.forEach(drop => {
                    if (drop.x > camX - 100 && drop.x < camX + viewW + 100 &&
                        drop.y > camY - 100 && drop.y < camY + viewH + 100) {
                        ctx.fillStyle = `rgba(200, 240, 255, ${drop.opacity * 2})`; 
                        ctx.fillText(drop.text, drop.x, drop.y);
                    }
                });
            }
        }

        ctx.strokeStyle = isCyber ? "#ff007f" : "#a0eeff"; 
        ctx.lineWidth = 5; 
        ctx.shadowBlur = this.gfxLevel; 
        ctx.shadowColor = ctx.strokeStyle;
        ctx.strokeRect(0, 0, this.worldW, this.worldH);
        ctx.shadowBlur = 0;
    }

    drawObstacles(ctx, obstacles) {
        if(!obstacles) return;
        const time = Date.now();
        const isCyber = this.mapTheme === 'CYBER';

        for (let o of obstacles) {
            ctx.save(); 
            if (o.type === 'FIREWALL') { 
                ctx.fillStyle = isCyber ? "rgba(255,0,0,0.15)" : "rgba(160, 238, 255, 0.4)"; 
                ctx.fillRect(o.x,o.y,o.w,o.h); 
                
                ctx.strokeStyle = isCyber ? "#ff0000" : "#ffffff"; 
                ctx.lineWidth = 2; 
                ctx.shadowBlur = this.gfxLevel; 
                ctx.shadowColor = ctx.strokeStyle;
                ctx.strokeRect(o.x,o.y,o.w,o.h); 
                
                ctx.save(); 
                ctx.beginPath();
                ctx.rect(o.x, o.y, o.w, o.h);
                ctx.clip();
                
                if (isCyber) {
                    ctx.strokeStyle = `rgba(255, 0, 0, ${0.1 + (this.gfxLevel*0.015)})`;
                    ctx.lineWidth = 2;
                    let offset = (time / 20) % 20;
                    ctx.beginPath();
                    for(let i = -o.h; i < o.w + o.h; i += 20) {
                        ctx.moveTo(o.x + i + offset, o.y);
                        ctx.lineTo(o.x + i - o.h + offset, o.y + o.h);
                    }
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + (this.gfxLevel*0.015)})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    for(let i = 0; i < o.w; i += 40) {
                        ctx.moveTo(o.x + i, o.y);
                        ctx.lineTo(o.x + i + 20, o.y + o.h);
                    }
                    ctx.stroke();
                }
                ctx.restore(); 

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 14px 'Share Tech Mono', monospace";
                ctx.textAlign = "center";
                ctx.shadowBlur = this.gfxLevel / 2;
                ctx.fillText(isCyber ? "[ FIREWALL ]" : "[ FROZEN WALL ]", o.x + o.w/2, o.y + o.h/2);
            }
            else { 
                const pulse = Math.sin(time / 200) * 5;
                
                ctx.fillStyle = isCyber ? "rgba(15,0,0,0.8)" : "rgba(0,10,25,0.8)"; 
                ctx.beginPath(); 
                ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); 
                ctx.fill(); 
                
                ctx.strokeStyle = isCyber ? "rgba(255,0,0,0.5)" : "rgba(0,150,255,0.5)";
                ctx.lineWidth = 2;
                ctx.shadowBlur = this.gfxLevel * 1.5;
                ctx.shadowColor = isCyber ? "#ff0000" : "#0055ff";
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.r + pulse, 0, Math.PI*2);
                ctx.stroke();

                ctx.fillStyle = isCyber ? "#ff5555" : "#55aaff";
                ctx.font = "bold 12px 'Share Tech Mono', monospace";
                ctx.textAlign = "center";
                ctx.shadowBlur = 0;
                ctx.fillText(isCyber ? "[ BAD SECTOR ]" : "[ CRYO LEAK ]", o.x, o.y);
            }
            ctx.restore(); 
        }
    }

    drawParticlesAndPopups(ctx) {
        this.particles.forEach(p => p.draw(ctx));
        this.popups.forEach(p => p.draw(ctx));
    }

    drawVignette(ctx, w, h) { 
        if (this.gfxLevel <= 4) return; 
        const intensity = 0.3 + (this.gfxLevel / 60); 
        const gradient = ctx.createRadialGradient(w/2, h/2, h/3, w/2, h/2, w/1.2);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
}