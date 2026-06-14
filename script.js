const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pCanvas = document.getElementById('previewCanvas');
const pCtx = pCanvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();

// 1. DATA TRANSLASI & CONFIG (REVISI PENAMAAN)
const TRANSLATIONS = {
    ID: {
        tagline: "HARDWARE ASSEMBLY EDITION", 
        start: "MULAI GAME",
        customize: "KUSTOMISASI KARAKTER", 
        guide: "PANDUAN BERMAIN", 
        settings: "PENGATURAN",
        specLabel: "BEBAN_GPU:", 
        configTitle: "PENGATURAN SISTEM", 
        custTitle: "KUSTOMISASI KARAKTER",
        selectSkin: "PILIH WARNA INTI:", 
        labelVol: "VOLUME AUDIO", 
        labelFps: "REFRESH RATE (FPS)",
        labelGraphic: "KUALITAS GRAFIK", 
        labelDiff: "LEVEL PERAKITAN", 
        btnApply: "SIMPAN & KEMBALI",
        guideTitle: "PANDUAN BERMAIN",
        back: "KEMBALI",
        notes: {
            graphic: { 4: "RENDAH: Performa sangat lancar.", 10: "SEDANG: Seimbang dan stabil.", 20: "ULTRA: Visual penuh." },
            diff: { 1: "MUDAH: Perakitan santai.", 1.5: "NORMAL: Standar teknisi.", 2: "SULIT: Butuh reflek tinggi.", 3: "EXTREME: Kecepatan maksimal!" }
        }
    },
    EN: {
        tagline: "HARDWARE ASSEMBLY EDITION", 
        start: "START GAME",
        customize: "CHARACTER CUSTOMIZE", 
        guide: "PLAY GUIDE", 
        settings: "SETTINGS",
        specLabel: "GPU_LOAD:", 
        configTitle: "SYSTEM CONFIGURATION", 
        custTitle: "CHARACTER CUSTOMIZATION",
        selectSkin: "SELECT CORE COLOR:", 
        labelVol: "AUDIO VOLUME", 
        labelFps: "REFRESH RATE (FPS)",
        labelGraphic: "GRAPHIC QUALITY", 
        labelDiff: "ASSEMBLY LEVEL", 
        btnApply: "APPLY & RETURN",
        guideTitle: "PLAY GUIDE",
        back: "RETURN",
        notes: {
            graphic: { 4: "LOW: Maximum performance.", 10: "MEDIUM: Balanced stability.", 20: "ULTRA: Rich visuals." },
            diff: { 1: "EASY: Relaxed assembly.", 1.5: "NORMAL: Technician standard.", 2: "HARD: High reflex required.", 3: "EXTREME: Maximum speed!" }
        }
    }
};

let currentLang = 'ID'; // Default ke Indonesia sesuai request
let snakeCount = 10;
let gameSpeedMultiplier = 1.5;
let targetFps = 60;
let lastFrameTime = performance.now();
let playerColorIdx = 0;
const COLORS = ['#00f2ff', '#ff007f', '#39ff14', '#ffff00', '#bc13fe'];

// 2. SOUND
class SoundManager {
    constructor() { this.bgMusic = document.getElementById('bgMusic'); this.isStarted = false; }
    start() { if (!this.isStarted && this.bgMusic) { this.bgMusic.volume = 0.5; this.bgMusic.play().then(() => { this.isStarted = true; }).catch(() => {}); } }
    setVolume(val) { if(this.bgMusic) this.bgMusic.volume = val; }
}
const sounds = new SoundManager();

// 3. SNAKE AI (Glow Restored)
class DemoSnake {
    constructor(isPreview = false) { this.isPreview = isPreview; this.reset(); }
    reset() {
        this.x = this.isPreview ? 150 : Math.random() * canvas.width;
        this.y = this.isPreview ? 75 : Math.random() * canvas.height;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = this.isPreview ? 0.8 : (1.2 + Math.random() * 1.5) * (gameSpeedMultiplier * 0.7); 
        this.segments = [];
        this.palette = this.isPreview ? null : COLORS[Math.floor(Math.random() * COLORS.length)];
        for(let i=0; i<30; i++) this.segments.push({x: this.x, y: this.y});
    }
    update() {
        this.angle += (Math.random() - 0.5) * 0.2;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        const limX = this.isPreview ? 300 : canvas.width;
        const limY = this.isPreview ? 150 : canvas.height;
        if (this.x < -100 || this.x > limX + 100 || this.y < -100 || this.y > limY + 100) this.reset();
        this.segments.unshift({x: this.x, y: this.y});
        this.segments.pop();
    }
    draw(targetCtx) {
        targetCtx.save();
        const drawColor = this.isPreview ? COLORS[playerColorIdx] : this.palette;
        targetCtx.shadowBlur = 15;
        targetCtx.shadowColor = drawColor;
        this.segments.forEach((seg, i) => {
            targetCtx.globalAlpha = 1 - (i / this.segments.length);
            targetCtx.fillStyle = drawColor;
            targetCtx.beginPath(); targetCtx.arc(seg.x, seg.y, 15 - (i/3), 0, Math.PI*2); targetCtx.fill();
        });
        targetCtx.restore();
    }
}

let snakes = Array.from({ length: snakeCount }, () => new DemoSnake());
const previewSnake = new DemoSnake(true);

// 4. UI LOGIC (UPDATED)
function updateUI() {
    const lang = TRANSLATIONS[currentLang];
    document.getElementById('txt-tagline').innerText = lang.tagline;
    document.getElementById('btn-start').innerText = lang.start;
    document.getElementById('btn-customize').innerText = lang.customize;
    document.getElementById('btn-guide').innerText = lang.guide;
    document.getElementById('btn-settings').innerText = lang.settings;
    document.getElementById('txt-spec-label').innerText = lang.specLabel;
    document.getElementById('txt-settings-title').innerText = lang.configTitle;
    document.getElementById('txt-cust-title').innerText = lang.custTitle;
    document.getElementById('txt-select-skin').innerText = lang.selectSkin;
    document.getElementById('txt-label-vol').innerText = lang.labelVol;
    document.getElementById('txt-label-fps').innerText = lang.labelFps;
    document.getElementById('txt-label-graphic').innerText = lang.labelGraphic;
    document.getElementById('txt-label-diff').innerText = lang.labelDiff;
    document.getElementById('btn-settings-back').innerText = lang.btnApply;
    document.getElementById('btn-cust-back').innerText = lang.btnApply;
    document.getElementById('txt-guide-title').innerText = lang.guideTitle;
    document.getElementById('btn-back').innerText = lang.back;
    updateNotes();
}

function updateNotes() {
    const gVal = document.getElementById('graphic-select').value;
    const dVal = document.getElementById('difficulty-select').value;
    const lang = TRANSLATIONS[currentLang];
    document.getElementById('config-note').innerText = `${lang.notes.graphic[gVal]}\n${lang.notes.diff[dVal]}`;
    const fill = document.getElementById('spec-fill');
    const rank = document.getElementById('txt-spec-rank');
    fill.className = "";
    if(gVal == 4) { fill.classList.add('fill-low'); rank.innerText = currentLang === 'ID' ? "RINGAN" : "LIGHT"; }
    else if(gVal == 10) { fill.classList.add('fill-med'); rank.innerText = "STABLE"; }
    else { fill.classList.add('fill-ultra'); rank.innerText = currentLang === 'ID' ? "BERAT" : "HEAVY"; }
}

const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

// 5. NAVIGATION & EVENTS
document.getElementById('btn-lang').onclick = () => { currentLang = currentLang === 'EN' ? 'ID' : 'EN'; updateUI(); };
document.getElementById('btn-customize').onclick = () => showScreen('customize-menu');
document.getElementById('btn-settings').onclick = () => showScreen('settings-menu');
document.getElementById('btn-guide').onclick = () => showScreen('guide-menu');
document.getElementById('btn-back').onclick = () => showScreen('main-menu');
document.getElementById('btn-cust-back').onclick = () => showScreen('main-menu');
document.getElementById('btn-settings-back').onclick = () => {
    snakeCount = parseInt(document.getElementById('graphic-select').value);
    gameSpeedMultiplier = parseFloat(document.getElementById('difficulty-select').value);
    targetFps = parseInt(document.getElementById('fps-select').value);
    snakes = Array.from({ length: snakeCount }, () => new DemoSnake());
    showScreen('main-menu');
};

document.querySelectorAll('.color-opt').forEach(opt => {
    opt.onclick = (e) => {
        document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
        e.target.classList.add('active');
        playerColorIdx = parseInt(e.target.dataset.index);
    };
});

window.onclick = () => sounds.start();
document.getElementById('vol-slider').oninput = (e) => sounds.setVolume(e.target.value);
document.getElementById('graphic-select').onchange = updateNotes;
document.getElementById('difficulty-select').onchange = updateNotes;

// 6. ANIMATION ENGINE (120 FPS)
function animate(currentTime) {
    requestAnimationFrame(animate);
    const delta = currentTime - lastFrameTime;
    const interval = 1000 / targetFps;

    if (delta >= interval) {
        lastFrameTime = currentTime - (delta % interval);
        ctx.fillStyle = 'rgba(13, 13, 20, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        snakes.forEach(s => { s.update(); s.draw(ctx); });
        pCtx.fillStyle = '#050505';
        pCtx.fillRect(0, 0, 300, 150);
        previewSnake.update();
        previewSnake.draw(pCtx);
    }
}

window.onload = () => { updateUI(); requestAnimationFrame(animate); };