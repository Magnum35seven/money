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

// Primary and backup APIs
const API_PRIMARY = 'https://api.frankfurter.app/latest?from=AUD&to=ZAR';
const API_BACKUP = 'https://api.exchangerate.host/latest?base=AUD&symbols=ZAR';

// Helper to format timestamp
function nowIso() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

async function fetchFrom(url) {
  // cache-buster to avoid intermediate caches
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function fetchRate(sourceHint) {
  const statusEl = document.getElementById('rate-status');
  const btn = document.getElementById('refresh-rate');
  if (btn) btn.disabled = true;

  try {
    let data;
    let source = 'primary';

    try {
      data = await fetchFrom(API_PRIMARY);
      source = 'primary';
      console.log('[rate] fetched from primary (', API_PRIMARY, ')', data);
    } catch (e1) {
      console.warn('[rate] primary failed, trying backup', e1);
      data = await fetchFrom(API_BACKUP);
      source = 'backup';
      console.log('[rate] fetched from backup (', API_BACKUP, ')', data);
    }

    // frankfurter returns {rates: {ZAR: value}}; exchangerate.host returns similar under rates
    const rateVal = data && data.rates && (data.rates.ZAR || data.rates.ZAR);
    if (!rateVal) throw new Error('Unexpected response structure: ' + JSON.stringify(data));

    currentRate = parseFloat(rateVal);
    localStorage.setItem('aud_zar_rate', currentRate);

    if (statusEl) statusEl.innerText = `Live Rate (${source}): 1 AUD = ${currentRate.toFixed(4)} ZAR — updated ${nowIso()}`;
  } catch (e) {
    console.error('[rate] failed to obtain live rate:', e);
    if (statusEl) statusEl.innerText = `Offline Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR (cached/default) — ${nowIso()}`;
  } finally {
    if (btn) btn.disabled = false;
  }

  // update conversion display
  calculate();
}

// Manual refresh helper called by button
function refreshRate() {
  fetchRate('manual');
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
  // Wire up refresh button if present
  const refreshBtn = document.getElementById('refresh-rate');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshRate);

  fetchRate();
  // Refresh rate every 5 minutes (300000ms)
  setInterval(fetchRate, 300000);
});
