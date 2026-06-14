/**
 * Player.js - OOP Refactored Edition (PRE-FILL SEGMENTS & SPRINT MODE)
 */

window.GameObject = class GameObject {
    #x; 
    #y; 

    constructor(x, y) {
        if (new.target === window.GameObject) {
            throw new Error("Abstract Class 'GameObject' tidak boleh di-instansiasi langsung!");
        }
        this.#x = x || 0;
        this.#y = y || 0;
    }

    get x() { return this.#x; }
    set x(val) { this.#x = val; }
    get y() { return this.#y; }
    set y(val) { this.#y = val; }

    draw(ctx) { 
        throw new Error("Fungsi abstrak draw(ctx) wajib di-override!"); 
    }
};

window.IMovable = (Base) => class extends Base {
    updatePosition() { throw new Error("Interface method updatePosition() wajib di-implementasi!"); }
};

window.ICollectible = (Base) => class extends Base {
    onCollected() { throw new Error("Interface method onCollected() wajib di-implementasi!"); }
};

class Snake extends window.IMovable(window.GameObject) {
    constructor(x, y, gfxLevel) {
        super(x, y);
        this.gfxLevel = gfxLevel || 10;
        this.angle = 0;
        this.baseRadius = 12;
        this.radius = this.baseRadius;
        this.segments = [];
        this.maxSegments = 10;
        this.speed = 3;
        this.baseSpeed = 3;
        
        // SPRINT DITAMBAHKAN SEBAGAI POWERUP SESAAT
        this.powers = { OVERCLOCK: 0, UNDERVOLT: 0, MAGNET: 0, RADAR: 0, RAMPAGE: 0, SPRINT: 0 };
        this.isKing = false; 
    }

    updateSize(currentScore) {
        if (isNaN(currentScore)) return; 
        
        this.maxSegments = Math.floor(10 + (currentScore / 60)); 
        let newRadius = this.baseRadius + (currentScore / 800);
        this.radius = Math.min(newRadius, 32); 
    }

    drawCrown(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "#FFD700"; 
        ctx.shadowBlur = this.gfxLevel >= 10 ? 15 : 0;
        ctx.shadowColor = "#FFD700";
        
        ctx.beginPath();
        ctx.moveTo(-12, 0); ctx.lineTo(-18, -15); ctx.lineTo(-6, -8);
        ctx.lineTo(0, -20); ctx.lineTo(6, -8); ctx.lineTo(18, -15);
        ctx.lineTo(12, 0); ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = "#ff007f";
        ctx.beginPath(); ctx.arc(0, -10, 3, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }

    drawBody(ctx, color) {
        ctx.save();
        
        if(this.gfxLevel >= 20 && this.segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            for(let i=1; i<this.segments.length; i++) {
                ctx.lineTo(this.segments[i].x, this.segments[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(2, this.radius * 0.3); 
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 15; 
            ctx.shadowColor = color;
            ctx.stroke();
        }

        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const fadeFactor = i / this.segments.length;
            ctx.globalAlpha = Math.max(0.1, 1 - fadeFactor);
            ctx.fillStyle = color;
            
            if (this.gfxLevel >= 20 || (this.gfxLevel >= 10 && i < 3)) {
                ctx.shadowBlur = this.gfxLevel >= 20 ? 25 : 15;
                ctx.shadowColor = color;
            } else {
                ctx.shadowBlur = 0;
            }
            
            let offsetX = 0, offsetY = 0;
            if (this.powers['UNDERVOLT'] > 0 && i > 5) {
                offsetX = (Math.random() - 0.5) * 3;
                offsetY = (Math.random() - 0.5) * 3;
            }
            if (this.powers['RAMPAGE'] > 0) {
                offsetX += (Math.random() - 0.5) * 4;
                offsetY += (Math.random() - 0.5) * 4;
            }

            let drawX = seg.x + offsetX;
            let drawY = seg.y + offsetY;
            let currentRad = Math.max(3, this.radius - (fadeFactor * (this.radius * 0.7)));
            if (isNaN(currentRad)) currentRad = 5; 

            ctx.beginPath();
            ctx.arc(drawX, drawY, currentRad, 0, Math.PI * 2);
            ctx.fill();

            if (this.gfxLevel >= 10 && currentRad > 5) {
                ctx.shadowBlur = 0; 
                ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
                ctx.lineWidth = 1 + (currentRad * 0.05); 
                ctx.beginPath();
                ctx.arc(drawX, drawY, currentRad - 0.5, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                ctx.beginPath();
                ctx.arc(drawX - currentRad * 0.3, drawY - currentRad * 0.3, currentRad * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawEyes(ctx, x, y, angle, pupilColor) {
        ctx.globalAlpha = 1;
        const eyeDist = this.radius * 0.5; 
        const eyeSize = this.radius * 0.3; 
        const lx = x + Math.cos(angle - 0.6) * eyeDist, ly = y + Math.sin(angle - 0.6) * eyeDist;
        const rx = x + Math.cos(angle + 0.6) * eyeDist, ry = y + Math.sin(angle + 0.6) * eyeDist;
        
        const scleraColor = this.powers['RAMPAGE'] > 0 ? "#ff0000" : "#ffffff";
        const finalPupil = this.powers['RAMPAGE'] > 0 ? "#ffff00" : pupilColor;

        ctx.fillStyle = scleraColor;
        ctx.beginPath(); ctx.arc(lx, ly, eyeSize, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, eyeSize, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = finalPupil;
        ctx.beginPath(); ctx.arc(lx + Math.cos(angle)*1, ly + Math.sin(angle)*1, eyeSize*0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + Math.cos(angle)*1, ry + Math.sin(angle)*1, eyeSize*0.4, 0, Math.PI*2); ctx.fill();
    }
}

class Player extends Snake {
    constructor(difficultyMult, gfxLevel) {
        super(2500, 2500, gfxLevel);
        this.diffMult = difficultyMult || 1.5; 
        this.turnSpeed = 0.15;    
        this.reset();
    }

    reset() {
        this.x = 2500; 
        this.y = 2500;
        this.angle = 0;           
        this.baseSpeed = 3.5 * this.diffMult; 
        this.speed = this.baseSpeed; 
        this.powers = { OVERCLOCK: 0, UNDERVOLT: 0, MAGNET: 0, RADAR: 0, RAMPAGE: 0, SPRINT: 0 };
        
        this.updateSize(0); 

        // PREFILL BADAN AGAR TIDAK BANTET SAAT LAHIR
        this.segments = [];
        for (let i = 0; i < this.maxSegments; i++) {
            this.segments.push({
                x: this.x - Math.cos(this.angle) * (i * this.speed * 0.5),
                y: this.y - Math.sin(this.angle) * (i * this.speed * 0.5)
            });
        }

        const nameInput = document.getElementById('player-name-input');
        this.name = (nameInput && nameInput.value.trim() !== "") ? nameInput.value.toUpperCase() : "PLAYER_01";
    }

    applyPowerUp(type, duration) {
        this.powers[type] = Math.max(this.powers[type], duration); 
    }

    updatePosition(targetAngle, delta) {
        for (let p in this.powers) {
            if (this.powers[p] > 0) {
                this.powers[p] -= delta;
                if (this.powers[p] < 0) this.powers[p] = 0;
            }
        }

        // HIERARKI KECEPATAN (RAMPAGE > SPRINT > OVERCLOCK)
        if (this.powers['RAMPAGE'] > 0) this.speed = this.baseSpeed * 2.5; 
        else if (this.powers['SPRINT'] > 0) this.speed = this.baseSpeed * 2.0; 
        else if (this.powers['OVERCLOCK'] > 0) this.speed = this.baseSpeed * 1.8;
        else if (this.powers['UNDERVOLT'] > 0) this.speed = this.baseSpeed * 0.5;
        else this.speed = this.baseSpeed;

        if (targetAngle !== null) {
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * this.turnSpeed;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.segments.unshift({x: this.x, y: this.y});
        if (this.segments.length > this.maxSegments) {
            this.segments.pop();
        }
    }

    draw(ctx) {
        let baseColor = (typeof COLORS !== 'undefined' && typeof playerColorIdx !== 'undefined') ? COLORS[playerColorIdx] : "#00f2ff";
        
        if (this.powers['RADAR'] > 0) baseColor = "#39ff14";
        if (this.powers['MAGNET'] > 0) baseColor = "#bc13fe";
        if (this.powers['UNDERVOLT'] > 0) baseColor = "#00ffff"; 
        if (this.powers['OVERCLOCK'] > 0) baseColor = "#ffaa00"; 
        
        if (this.powers['RAMPAGE'] > 0) {
            const hue = (Date.now() / 5) % 360; 
            baseColor = `hsl(${hue}, 100%, 50%)`;
        }

        this.drawBody(ctx, baseColor);
        this.drawEyes(ctx, this.x, this.y, this.angle, "#000000");

        if (this.isKing) {
            this.drawCrown(ctx, this.x, this.y - (this.radius + 15));
        }

        ctx.fillStyle = baseColor; 
        ctx.font = "bold 12px 'Share Tech Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y - (this.radius + (this.isKing ? 35 : 15)));
    }
}

const BOT_NAMES = [
    "[BOT] TROJAN", "[BOT] RANSOMWARE", "[BOT] SPYWARE", "[BOT] ROOTKIT", 
    "[BOT] WORM", "[BOT] ADWARE", "[BOT] KEYLOGGER", "[BOT] BOTNET"
];

class BotSnake extends Snake {
    constructor(worldW, worldH, color, index, gfxLevel, diffMult, forceGiant = false) {
        super(0, 0, gfxLevel);
        this.worldW = worldW;
        this.worldH = worldH;
        this.color = color || "#ff3300";
        this.name = BOT_NAMES[index % BOT_NAMES.length]; 
        this.diffMult = diffMult || 1.5;
        this.forceGiant = forceGiant; 
        this.reset();
    }

    reset() {
        do {
            this.x = 300 + Math.random() * (this.worldW - 600);
            this.y = 300 + Math.random() * (this.worldH - 600);
        } while (Math.hypot(this.x - 2500, this.y - 2500) < 600);

        this.angle = Math.random() * Math.PI * 2;
        
        const isGiant = this.forceGiant || Math.random() < 0.15;
        this.baseSpeed = (isGiant ? 1.5 : 2.0) + (Math.random() * 1.5 * this.diffMult); 
        this.speed = this.baseSpeed;
        
        this.powers = { OVERCLOCK: 0, UNDERVOLT: 0, MAGNET: 0, RADAR: 0, RAMPAGE: 0, SPRINT: 0 };
        
        this.score = isGiant ? Math.floor(8000 + Math.random() * 7000) : Math.floor(100 + Math.random() * 500); 
        this.updateSize(this.score); 
        
        // PREFILL BADAN BOT AGAR RAKSASA SEJAK FRAME PERTAMA
        this.segments = [];
        for (let i = 0; i < this.maxSegments; i++) {
            this.segments.push({
                x: this.x - Math.cos(this.angle) * (i * this.speed * 0.5),
                y: this.y - Math.sin(this.angle) * (i * this.speed * 0.5)
            });
        }
        
        this.turnTimer = 0;
        this.targetAngle = this.angle;
    }

    applyPowerUp(type, duration) {
        this.powers[type] = Math.max(this.powers[type], duration); 
    }

    updatePosition(delta, obstacles, fragments) {
        for (let p in this.powers) {
            if (this.powers[p] > 0) {
                this.powers[p] -= delta;
                if (this.powers[p] < 0) this.powers[p] = 0;
            }
        }

        if (this.powers['OVERCLOCK'] > 0) this.speed = this.baseSpeed * 1.8;
        else if (this.powers['UNDERVOLT'] > 0) this.speed = this.baseSpeed * 0.5;
        else this.speed = this.baseSpeed;

        this.score += 0.2; 
        this.updateSize(this.score); 

        this.turnTimer++;

        let dangerInFront = false;
        if (obstacles) {
            let lookX = this.x + Math.cos(this.angle) * 150;
            let lookY = this.y + Math.sin(this.angle) * 150;
            for (let obs of obstacles) {
                if (obs.type === 'FIREWALL') {
                    if (lookX > obs.x - 20 && lookX < obs.x + obs.w + 20 && lookY > obs.y - 20 && lookY < obs.y + obs.h + 20) {
                        dangerInFront = true; break;
                    }
                } else if (obs.type === 'BAD_SECTOR') {
                    if (Math.hypot(lookX - obs.x, lookY - obs.y) < obs.r + 30) {
                        dangerInFront = true; break;
                    }
                }
            }
        }

        let foodTarget = null;
        let closestDist = 400; 

        if (!dangerInFront && fragments && fragments.length > 0) {
            for (let f of fragments) {
                let d = Math.hypot(this.x - f.x, this.y - f.y);
                if (d < closestDist) {
                    closestDist = d;
                    foodTarget = f;
                }
            }
        }

        if (dangerInFront) {
            this.targetAngle += 1.5; 
            this.turnTimer = 0;
        } else if (foodTarget) {
            this.targetAngle = Math.atan2(foodTarget.y - this.y, foodTarget.x - this.x);
            this.turnTimer = 0;
        } else {
            const turnFrequency = 50 + Math.random() * (100 / this.diffMult);
            if (this.turnTimer > turnFrequency) {
                this.targetAngle += (Math.random() - 0.5) * 2; 
                this.turnTimer = 0;
            }
        }

        const margin = 150;
        let hitWall = false;
        
        if (this.x < margin) { this.x = margin; this.targetAngle = 0; hitWall = true; }
        else if (this.x > this.worldW - margin) { this.x = this.worldW - margin; this.targetAngle = Math.PI; hitWall = true; }
        
        if (this.y < margin) { this.y = margin; this.targetAngle = Math.PI / 2; hitWall = true; }
        else if (this.y > this.worldH - margin) { this.y = this.worldH - margin; this.targetAngle = -Math.PI / 2; hitWall = true; }

        if (hitWall) this.angle = this.targetAngle; 

        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.08;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.segments.unshift({x: this.x, y: this.y});
        if (this.segments.length > this.maxSegments) this.segments.pop();
    }

    draw(ctx) {
        let drawColor = this.color;
        if (this.powers['UNDERVOLT'] > 0) drawColor = "#00ffff"; 
        if (this.powers['OVERCLOCK'] > 0) drawColor = "#ffaa00"; 

        this.drawBody(ctx, drawColor);
        this.drawEyes(ctx, this.x, this.y, this.angle, "#ffcccc");
        
        if (this.isKing) {
            this.drawCrown(ctx, this.x, this.y - (this.radius + 15));
        }

        ctx.fillStyle = drawColor;
        ctx.font = "bold 12px 'Share Tech Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y - (this.radius + (this.isKing ? 35 : 15)));
    }
}