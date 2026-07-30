// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// --- TAB ROUTING ---
function switchTab(tabName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  document.getElementById(`screen-${tabName}`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

// --- CONVERTER LOGIC ---
let currentRate = parseFloat(localStorage.getItem('aud_zar_rate')) || 11.58;
let isAudToZar = true;
const API_URL = 'https://api.frankfurter.app/latest?from=AUD&to=ZAR';

async function fetchRate() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.rates && data.rates.ZAR) {
      currentRate = data.rates.ZAR;
      localStorage.setItem('aud_zar_rate', currentRate);
    }
  } catch (e) {
    console.log('Using offline cached rate');
  }
  updateDisplay();
}

function calculate() {
  const inputVal = parseFloat(document.getElementById('amount').value) || 0;
  const resultEl = document.getElementById('result-value');

  if (isAudToZar) {
    const total = inputVal * currentRate;
    resultEl.innerText = `R ${total.toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  } else {
    const total = inputVal / currentRate;
    resultEl.innerText = `$ ${total.toLocaleString('en-AU', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  }
}

function toggleDirection() {
  isAudToZar = !isAudToZar;
  document.getElementById('input-label').innerText = isAudToZar ? 'Amount (AUD)' : 'Amount (ZAR)';
  document.getElementById('result-label').innerText = isAudToZar ? 'Converted Amount (ZAR)' : 'Converted Amount (AUD)';
  calculate();
}

function updateDisplay() {
  document.getElementById('rate-status').innerText = `Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
  calculate();
}

// --- SAFETRIP VAULT LOGIC (LOCALSTORAGE) ---
function saveVault() {
  localStorage.setItem('vault_passport', document.getElementById('v-passport').value);
  localStorage.setItem('vault_insurance', document.getElementById('v-insurance').value);
  localStorage.setItem('vault_hotel', document.getElementById('v-hotel').value);
}

function loadVault() {
  document.getElementById('v-passport').value = localStorage.getItem('vault_passport') || '';
  document.getElementById('v-insurance').value = localStorage.getItem('vault_insurance') || '';
  document.getElementById('v-hotel').value = localStorage.getItem('vault_hotel') || '';
}

// Initialize
fetchRate();
loadVault();