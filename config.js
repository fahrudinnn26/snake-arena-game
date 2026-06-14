// config.js - Tempat pusat data dan pengaturan dasar
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
        labelName: "IDENTITAS_PLAYER:",
        labelVol: "VOLUME AUDIO", 
        labelFps: "REFRESH RATE (FPS)",
        labelGraphic: "KUALITAS GRAFIK", 
        labelDiff: "LEVEL PERAKITAN", 
        btnApply: "SIMPAN & KEMBALI",
        guideTitle: "PANDUAN BERMAIN",
        back: "KEMBALI",
        hint: "KLIK DI MANA SAJA UNTUK AUDIO",
        notes: {
            graphic: { 
                4: "RENDAH: Performa sangat lancar.", 
                10: "SEDANG: Seimbang dan stabil.", 
                20: "ULTRA: Visual penuh." 
            },
            diff: { 
                1: "CORE_i3: Perakitan santai.", 
                1.5: "CORE_i5: Standar teknisi.", 
                2: "CORE_i7: Butuh reflek tinggi.", 
                3: "CORE_i9: Kecepatan maksimal!" 
            }
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
        labelName: "PLAYER_IDENTITY:",
        labelVol: "AUDIO VOLUME", 
        labelFps: "REFRESH RATE (FPS)",
        labelGraphic: "GRAPHIC QUALITY", 
        labelDiff: "ASSEMBLY LEVEL", 
        btnApply: "APPLY & RETURN",
        guideTitle: "PLAY GUIDE",
        back: "RETURN",
        hint: "CLICK ANYWHERE TO START AUDIO",
        notes: {
            graphic: { 
                4: "LOW: Maximum performance.", 
                10: "MEDIUM: Balanced stability.", 
                20: "ULTRA: Rich visuals." 
            },
            diff: { 
                1: "CORE_i3: Relaxed assembly.", 
                1.5: "CORE_i5: Technician standard.", 
                2: "CORE_i7: High reflex required.", 
                3: "CORE_i9: Maximum speed!" 
            }
        }
    }
};

const COLORS = ['#00f2ff', '#ff007f', '#39ff14', '#ffff00', '#bc13fe'];

// Variabel Global - Dioptimalkan untuk layar 120HZ
let currentLang = 'ID'; 
let snakeCount = 10;
let gameSpeedMultiplier = 1.5;
let targetFps = 120; // 
let playerColorIdx = 0;
let playerName = "PLAYER_01";