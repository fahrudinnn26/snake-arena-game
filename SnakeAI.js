class DemoSnake {
    constructor(isPreview = false) { 
        this.isPreview = isPreview; 
        this.reset(); 
    }
    
    reset() {
        this.x = this.isPreview ? 150 : Math.random() * canvas.width;
        this.y = this.isPreview ? 75 : Math.random() * canvas.height;
        this.angle = Math.random() * Math.PI * 2;
        
        this.speed = this.isPreview ? 1.5 : (1.2 + Math.random() * 1.5) * (gameSpeedMultiplier * 0.7); 
        this.segments = [];
        this.palette = this.isPreview ? null : COLORS[Math.floor(Math.random() * COLORS.length)];
        
        // Timer buat animasi mata berkedip
        this.blinkCounter = 0; 
        
        const panjangEkor = this.isPreview ? 150 : 30; 
        for(let i=0; i<panjangEkor; i++) {
            this.segments.push({x: this.x, y: this.y});
        }
    }
    
    update() {
        this.angle += (Math.random() - 0.5) * 0.2;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        const limX = this.isPreview ? 300 : canvas.width;
        const limY = this.isPreview ? 150 : canvas.height;
        
        if (this.isPreview) {
            if (this.x < 15 || this.x > limX - 15 || this.y < 15 || this.y > limY - 15) {
                this.angle += Math.PI; 
                this.x += Math.cos(this.angle) * this.speed * 2; 
                this.y += Math.sin(this.angle) * this.speed * 2;
            }
        } else {
            if (this.x < -100 || this.x > limX + 100 || this.y < -100 || this.y > limY + 100) {
                this.reset();
            }
        }
        
        // Logika kedip: 2% peluang buat kedip setiap frame
        if (this.blinkCounter > 0) {
            this.blinkCounter--;
        } else if (Math.random() < 0.02) {
            this.blinkCounter = 12; // Kedip selama 12 frame
        }
        
        this.segments.unshift({x: this.x, y: this.y});
        this.segments.pop();
    }
    
    draw(targetCtx) {
        targetCtx.save();
        const drawColor = this.isPreview ? COLORS[playerColorIdx] : this.palette;
        
        targetCtx.shadowBlur = 0; 
        
        // 1. GAMBAR BADAN ULAR (EFEK RIBBON CABLE)
        this.segments.forEach((seg, i) => {
            const fadeFactor = this.isPreview ? (i / (this.segments.length * 1.5)) : (i / this.segments.length);
            targetCtx.globalAlpha = Math.max(0.1, 1 - fadeFactor);
            
            targetCtx.fillStyle = drawColor;
            
            // Garis pemisah antar segmen biar keliatan mekanis/kabel
            targetCtx.strokeStyle = "rgba(0, 0, 0, 0.4)"; 
            targetCtx.lineWidth = 1;
            
            targetCtx.beginPath(); 
            const radius = this.isPreview ? (12 - (i/15)) : (15 - (i/3));
            targetCtx.arc(seg.x, seg.y, Math.max(1, radius), 0, Math.PI*2); 
            targetCtx.fill();
            targetCtx.stroke(); // Gambar garis hitam tipis melingkar
        });
        
        // 2. GAMBAR MATA & NAMA (KHUSUS PREVIEW)
        if (this.isPreview && this.segments.length > 0) {
            targetCtx.globalAlpha = 1; 
            
            const head = this.segments[0];
            const radiusKepala = 12;
            const eyeDist = radiusKepala * 0.6;
            
            const leftEyeX = head.x + Math.cos(this.angle - Math.PI/4) * eyeDist;
            const leftEyeY = head.y + Math.sin(this.angle - Math.PI/4) * eyeDist;
            const rightEyeX = head.x + Math.cos(this.angle + Math.PI/4) * eyeDist;
            const rightEyeY = head.y + Math.sin(this.angle + Math.PI/4) * eyeDist;
            
            // Animasi Kedip
            if (this.blinkCounter > 0) {
                targetCtx.strokeStyle = "#ffffff";
                targetCtx.lineWidth = 2;
                
                targetCtx.beginPath();
                targetCtx.moveTo(leftEyeX - 2.5, leftEyeY);
                targetCtx.lineTo(leftEyeX + 2.5, leftEyeY);
                targetCtx.stroke();
                
                targetCtx.beginPath();
                targetCtx.moveTo(rightEyeX - 2.5, rightEyeY);
                targetCtx.lineTo(rightEyeX + 2.5, rightEyeY);
                targetCtx.stroke();
            } else {
                // Mata normal
                targetCtx.fillStyle = "#ffffff"; 
                targetCtx.beginPath(); targetCtx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI*2); targetCtx.fill();
                targetCtx.beginPath(); targetCtx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI*2); targetCtx.fill();

                targetCtx.fillStyle = "#000000"; 
                targetCtx.beginPath(); targetCtx.arc(leftEyeX, leftEyeY, 1.5, 0, Math.PI*2); targetCtx.fill();
                targetCtx.beginPath(); targetCtx.arc(rightEyeX, rightEyeY, 1.5, 0, Math.PI*2); targetCtx.fill();
            }

            // --- TAMPILAN NAMA LIVE ---
            const nameInput = document.getElementById('player-name-input');
            const displayName = (nameInput && nameInput.value.trim() !== "") ? nameInput.value.toUpperCase() : "PLAYER_01";

            targetCtx.fillStyle = "#ff007f"; // Neon pink 
            targetCtx.font = "bold 10px 'Share Tech Mono', monospace";
            targetCtx.textAlign = "center";
            
            // Tulis nama sedikit di atas kepalanya
            targetCtx.fillText(displayName, head.x, head.y - 18);
        }
        
        targetCtx.restore();
    }
}