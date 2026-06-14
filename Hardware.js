/**
 * Hardware.js - Strict Mission Order, Fragments Lifespan & Scalable GFX
 */

class DataFragment extends window.ICollectible(window.GameObject) {
    constructor(x, y, color, gfxLevel) {
        super(x, y);
        this.color = color;
        this.gfxLevel = gfxLevel;
        this.size = 8 + Math.random() * 6;
        this.rotation = Math.random() * Math.PI;
        
        // FITUR BARU: Lifespan (Umur pecahan) 10-15 detik!
        this.life = 10000 + Math.random() * 5000; 
    }
    
    onCollected() { return true; } 
    
    update(delta) {
        this.life -= delta;
        this.rotation += 0.05;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        // Efek berkedip kalau mau musnah
        if (this.life < 3000 && Math.floor(Date.now() / 150) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.gfxLevel; 
        ctx.shadowColor = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

class HardwareComponent extends window.ICollectible(window.GameObject) {
    constructor(x, y, typeData, isMalware, gfxLevel) {
        super(x, y);
        this.data = typeData; 
        this.isMalware = isMalware;
        this.gfxLevel = gfxLevel;
        this.size = 50;
        this.rotation = Math.random() * Math.PI;
    }

    onCollected() { return this; } 

    draw(ctx) {
        this.rotation += 0.015;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.isMalware ? -this.rotation : this.rotation);

        const half = this.size / 2;
        const renderColor = this.isMalware ? "#ff0000" : this.data.color;
        const renderName = this.isMalware ? "MALWARE" : this.data.name;
        const renderShort = this.isMalware ? "VIRUS" : this.data.short;

        ctx.strokeStyle = this.isMalware ? "#aa0000" : "#d4af37"; 
        ctx.lineWidth = 2;
        for(let i = -half + 6; i < half; i += 10) {
            let glitch = this.isMalware ? (Math.random() * 8 - 4) : 0;
            ctx.beginPath(); ctx.moveTo(i, -half); ctx.lineTo(i + glitch, -half - 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i, half); ctx.lineTo(i + glitch, half + 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-half, i); ctx.lineTo(-half - 8, i + glitch); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(half, i); ctx.lineTo(half + 8, i + glitch); ctx.stroke();
        }

        ctx.shadowBlur = this.gfxLevel * 1.5;
        ctx.shadowColor = renderColor;
        
        ctx.fillStyle = "rgba(10, 10, 15, 0.95)"; 
        ctx.fillRect(-half, -half, this.size, this.size);
        
        ctx.strokeStyle = renderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(-half, -half, this.size, this.size);
        
        const pulse = Math.abs(Math.sin(Date.now() / 300));
        ctx.fillStyle = this.isMalware ? `rgba(255, 0, 0, ${0.4 + pulse*0.3})` : `rgba(255, 255, 255, ${0.2 + pulse*0.3})`;
        ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);

        ctx.strokeStyle = `rgba(255,255,255, ${0.1 + (this.gfxLevel/40)})`; 
        ctx.lineWidth = 1;
        ctx.beginPath(); 
        ctx.moveTo(-half+8, -half+8); ctx.lineTo(-half+15, -half+8); ctx.lineTo(-half+20, 0);
        ctx.moveTo(half-8, half-8); ctx.lineTo(half-15, half-8); ctx.lineTo(half-20, 0);
        ctx.stroke();

        ctx.restore();

        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = this.gfxLevel * 0.5;
        ctx.shadowColor = "#000";
        ctx.font = "bold 15px 'Share Tech Mono'";
        ctx.fillText(renderShort, this.x, this.y + 6);
        
        ctx.fillStyle = renderColor;
        ctx.shadowBlur = this.gfxLevel;
        ctx.shadowColor = renderColor;
        ctx.font = "12px 'Share Tech Mono'";
        ctx.fillText(renderName.toUpperCase(), this.x, this.y - 45); 
    }
}

class HardwareManager {
    constructor(worldW, worldH, gfxLevel) {
        this.worldW = worldW;
        this.worldH = worldH;
        this.gfxLevel = gfxLevel;
        this.masterList = [
            { name: "Motherboard", desc: "Papan Sirkuit", short: "MOBO", color: "#00f2ff", req: 1 },
            { name: "Processor", desc: "Otak Data", short: "CPU", color: "#39ff14", req: 2 }, 
            { name: "Memory", desc: "RAM Sistem", short: "RAM", color: "#ffff00", req: 3 },    
            { name: "Storage", desc: "Drive Cepat", short: "SSD", color: "#bc13fe", req: 2 },
            { name: "Graphics", desc: "GPU Visual", short: "GPU", color: "#ff007f", req: 1 },
            { name: "Power", desc: "Daya PSU", short: "PSU", color: "#ffaa00", req: 1 }
        ];
        this.reset();
    }

    reset() {
        this.missionIndex = 0;
        this.collectedCurrent = 0;
        this.pcBuiltCount = 0;
        this.activeComponents = [];
    }

    getCurrentTarget() {
        return this.masterList[this.missionIndex];
    }

    spawnMap(obstacles) {
        this.activeComponents = [];
        
        for (let comp of this.masterList) {
            let pos = this.getSafePos(obstacles);
            this.activeComponents.push(new HardwareComponent(pos.x, pos.y, comp, false, this.gfxLevel));
        }
        
        for (let i = 0; i < 3; i++) {
            let pos = this.getSafePos(obstacles);
            this.activeComponents.push(new HardwareComponent(pos.x, pos.y, null, true, this.gfxLevel));
        }
    }

    getSafePos(obstacles) {
        const pad = 300;
        let safe = false, attempts = 0, x = 0, y = 0;
        
        while (!safe && attempts < 50) {
            x = pad + Math.random() * (this.worldW - pad * 2);
            y = pad + Math.random() * (this.worldH - pad * 2);
            safe = true;
            
            if (Math.hypot(x - 2500, y - 2500) < 600) safe = false;
            
            for(let obs of obstacles) {
                let ox = obs.type === 'FIREWALL' ? obs.x + obs.w/2 : obs.x;
                let oy = obs.type === 'FIREWALL' ? obs.y + obs.h/2 : obs.y;
                let r = obs.type === 'FIREWALL' ? Math.max(obs.w, obs.h) : obs.r;
                if(Math.hypot(x - ox, y - oy) < r + 200) { safe = false; break; }
            }
            attempts++;
        }
        return {x, y};
    }

    draw(ctx) {
        this.activeComponents.forEach(c => c.draw(ctx));
    }
}