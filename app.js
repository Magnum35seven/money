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
let currentRate = parseFloat(localStorage.getItem('aud_zar_rate')) || 11.58;
let isAudToZar = true;

// FIXED API ENDPOINT: Uses base=AUD&symbols=ZAR
const API_URL = 'https://api.frankfurter.app/latest?base=AUD&symbols=ZAR';

async function fetchRate() {
  const statusEl = document.getElementById('rate-status');
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Network response failed');
    
    const data = await res.json();
    if (data && data.rates && data.rates.ZAR) {
      currentRate = data.rates.ZAR;
      localStorage.setItem('aud_zar_rate', currentRate);
      if (statusEl) statusEl.innerText = `Live Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
    }
  } catch (e) {
    console.warn('Using offline cached rate:', e);
    if (statusEl) statusEl.innerText = `Offline Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
  }
  calculate();
}

function calculate() {
  const inputEl = document.getElementById('amount');
  const resultEl = document.getElementById('result-value');
  if (!inputEl || !resultEl) return;

  const inputVal = parseFloat(inputEl.value) || 0;

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
  fetchRate();
});