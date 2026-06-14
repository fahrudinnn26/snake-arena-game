/**
 * SoundManager.js
 * DILENGKAPI DENGAN EFEK RAMPAGE MENDESIS!
 */
class SoundManager {
    constructor() {
        this.bgMusic = document.getElementById('bgMusic');
        this.rampageSound = document.getElementById('rampageMusic'); // Suara Hiss
        this.isStarted = false;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.sfxVolume = 0.5; 
        
        this.lastEatTime = 0;
        this.lastPowerUpTime = 0;
    }

    start() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (!this.isStarted && this.bgMusic) {
            this.bgMusic.volume = this.sfxVolume; 
            this.bgMusic.play()
                .then(() => {
                    this.isStarted = true;
                    const status = document.getElementById('audio-status');
                    if (status) {
                        const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ID';
                        status.innerText = lang === 'ID' ? "AUDIO: AKTIF" : "AUDIO: ONLINE";
                    }
                })
                .catch(error => console.log("Audio tertunda (butuh interaksi click layar)"));
        }
    }

    setVolume(val) {
        const volumeLevel = Math.max(0, Math.min(1, val));
        this.sfxVolume = volumeLevel; 
        if (this.bgMusic) this.bgMusic.volume = volumeLevel;
        if (this.rampageSound) this.rampageSound.volume = Math.min(1, volumeLevel * 1.5); // Desisan lebih kencang
    }

    // Fungsi Putar Suara Ngamuk
    playRampage() {
        if (this.rampageSound) {
            this.rampageSound.currentTime = 0;
            this.rampageSound.play().catch(e => console.log("Gagal mutar rampage sound"));
        }
    }

    playEat() {
        if (!this.audioCtx) return;
        const now = Date.now();
        if (now - this.lastEatTime < 40) return; 
        this.lastEatTime = now;

        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1); 
        
        gain.gain.setValueAtTime(this.sfxVolume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playPowerUp() {
        if (!this.audioCtx) return;
        const now = Date.now();
        if (now - this.lastPowerUpTime < 100) return;
        this.lastPowerUpTime = now;

        const t = this.audioCtx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; 
        
        freqs.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = t + (i * 0.08); 
            gain.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        });
    }

    playBotCrash(distance = 0) {
        if (!this.audioCtx) return;
        const maxDistance = 1800;
        let distanceMultiplier = 1.0 - (distance / maxDistance);
        if (distanceMultiplier < 0) distanceMultiplier = 0; 
        if (distanceMultiplier === 0) return; 

        const t = this.audioCtx.currentTime;
        const duration = 0.3; 
        const bufferSize = this.audioCtx.sampleRate * duration;
        
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = this.audioCtx.createGain();
        const finalVolume = this.sfxVolume * 0.8 * distanceMultiplier;
        
        gain.gain.setValueAtTime(finalVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        noise.start(t);
        noise.stop(t + duration);
    }
}

const sounds = new SoundManager();