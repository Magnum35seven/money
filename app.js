// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// --- TAB ROUTING ---
function switchTab(tabName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const screenEl = document.getElementById(`screen-${tabName}`);
  const tabEl = document.getElementById(`tab-${tabName}`);
  
  if (screenEl && tabEl) {
    screenEl.classList.add('active');
    tabEl.classList.add('active');
  }
}

// --- CONVERTER LOGIC ---
const DEFAULT_RATE = 11.46; // fallback only if live fetch and cache are unavailable
let currentRate = null; // will be populated by fetchRate()
let isAudToZar = true;

// Use Frankfurter's supported parameters: from & to
const API_URL = 'https://api.frankfurter.app/latest?from=AUD&to=ZAR';

async function fetchRate() {
  const statusEl = document.getElementById('rate-status');
  try {
    // Add cache-buster to avoid cached responses
    const res = await fetch(`${API_URL}&_=${Date.now()}`);
    if (!res.ok) throw new Error('Network response failed');
    
    const data = await res.json();
    if (data && data.rates && data.rates.ZAR) {
      currentRate = parseFloat(data.rates.ZAR);
      // persist the latest successful live rate for offline use
      localStorage.setItem('aud_zar_rate', currentRate);
      if (statusEl) statusEl.innerText = `Live Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
    }
  } catch (e) {
    console.warn('Failed to fetch live rate, falling back to cached/default rate:', e);
    // Prefer a cached value if available, otherwise use DEFAULT_RATE
    const cached = parseFloat(localStorage.getItem('aud_zar_rate'));
    if (!Number.isNaN(cached)) {
      currentRate = cached;
    } else {
      currentRate = DEFAULT_RATE;
    }
    if (statusEl) statusEl.innerText = `Offline Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
  }
  calculate();
}

function calculate() {
  const inputEl = document.getElementById('amount');
  const resultEl = document.getElementById('result-value');
  if (!inputEl || !resultEl) return;

  const inputVal = parseFloat(inputEl.value) || 0;

  // If rate isn't available yet, show a placeholder
  if (currentRate === null) {
    resultEl.innerText = 'Fetching rate...';
    return;
  }

  if (isAudToZar) {
    const total = inputVal * currentRate;
    resultEl.innerText = `R ${total.toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  } else {
    const total = inputVal / currentRate;
    resultEl.innerText = `$ ${total.toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }
}

function toggleDirection() {
  isAudToZar = !isAudToZar;
  
  const inputLabel = document.getElementById('input-label');
  const resultLabel = document.getElementById('result-label');
  
  if (inputLabel && resultLabel) {
    inputLabel.innerText = isAudToZar ? 'Amount (AUD)' : 'Amount (ZAR)';
    resultLabel.innerText = isAudToZar ? 'Converted Amount (ZAR)' : 'Converted Amount (AUD)';
  }
  calculate();
}

// --- SAFETRIP VAULT LOGIC (LOCALSTORAGE) ---
function saveVault() {
  localStorage.setItem('vault_passport', document.getElementById('v-passport')?.value || '');
  localStorage.setItem('vault_insurance', document.getElementById('v-insurance')?.value || '');
  localStorage.setItem('vault_hotel', document.getElementById('v-hotel')?.value || '');
}

function loadVault() {
  const p = document.getElementById('v-passport');
  const i = document.getElementById('v-insurance');
  const h = document.getElementById('v-hotel');

  if (p) p.value = localStorage.getItem('vault_passport') || '';
  if (i) i.value = localStorage.getItem('vault_insurance') || '';
  if (h) h.value = localStorage.getItem('vault_hotel') || '';
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadVault();
  // Always attempt a live fetch immediately on load
  fetchRate();
  // Refresh rate every 1 minute (60000ms) to keep it more up-to-date automatically
  setInterval(fetchRate, 60000);
});
