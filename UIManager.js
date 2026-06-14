/**
 * UIManager.js - Smart Localization & Screen Navigation System (Bug Fix Edition + Fullscreen)
 */

// Pastikan variabel bahasa aman dari bentrok (Error Redeclaration)
if (typeof window.currentLang === 'undefined') {
    window.currentLang = (typeof currentLang !== 'undefined') ? currentLang : 'ID';
}

window.showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
};

function updateUI() {
    const translatableElements = document.querySelectorAll('[data-id]');
    translatableElements.forEach(el => {
        const newText = window.currentLang === 'ID' ? el.getAttribute('data-id') : el.getAttribute('data-en');
        if (newText) el.innerHTML = newText;
    });

    const nameInput = document.getElementById('player-name-input');
    if(nameInput) {
        nameInput.placeholder = window.currentLang === 'ID' ? "MASUKKAN NAMA..." : "ENTER NAME...";
    }
    updateNotes();
}

const langBtn = document.getElementById('btn-lang');
if (langBtn) {
    langBtn.addEventListener('click', () => {
        window.currentLang = window.currentLang === 'ID' ? 'EN' : 'ID'; 
        langBtn.innerText = window.currentLang === 'ID' ? 'ID | EN' : 'EN | ID';
        updateUI();
    });
}

function updateNotes() {
    const gVal = document.getElementById('graphic-select')?.value || 10;
    const fill = document.getElementById('spec-fill');
    const rank = document.getElementById('txt-spec-rank');
    
    if(fill && rank) {
        fill.className = ""; 
        if(gVal == 4) { 
            fill.classList.add('fill-low'); 
            rank.innerText = window.currentLang === 'ID' ? "RINGAN" : "LIGHT"; 
        } else if(gVal == 10) { 
            fill.classList.add('fill-med'); 
            rank.innerText = "STABLE"; 
        } else { 
            fill.classList.add('fill-ultra'); 
            rank.innerText = window.currentLang === 'ID' ? "BERAT" : "HEAVY"; 
        }
    }
}

function savePlayerName() {
    const inputVal = document.getElementById('player-name-input').value;
    if(inputVal && inputVal.trim() !== "") {
        window.playerName = inputVal.toUpperCase();
    }
}

// === FUNGSI FULLSCREEN ===
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.log(`Gagal mengaktifkan fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// === SHORTCUT KEYBOARD 'F' UNTUK FULLSCREEN ===
window.addEventListener('keydown', (e) => {
    // Abaikan shortcut jika pemain sedang mengetik nama (biar gak kepencet pas ngetik huruf f)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return; 
    }

    if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateUI(); // Terapkan bahasa sejak awal
    
    document.getElementById('btn-customize')?.addEventListener('click', () => showScreen('customize-menu'));
    document.getElementById('btn-settings')?.addEventListener('click', () => showScreen('settings-menu'));
    document.getElementById('btn-guide')?.addEventListener('click', () => showScreen('guide-menu'));
    
    document.getElementById('btn-cust-back')?.addEventListener('click', () => {
        savePlayerName();
        showScreen('main-menu');
    });
    
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
        updateNotes(); 
        showScreen('main-menu');
    });
    
    document.getElementById('btn-back')?.addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('graphic-select')?.addEventListener('change', updateNotes);

    // Event Listener untuk tombol Fullscreen di menu Pengaturan
    document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullScreen);
});