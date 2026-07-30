let currentRate = parseFloat(localStorage.getItem('aud_zar_rate')) || 11.58;
let isAudToZar = true;

const API_URL = 'https://api.frankfurter.app/latest?from=AUD&to=ZAR';

// Fetch exchange rate on launch
async function fetchRate() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    if (data.rates && data.rates.ZAR) {
      currentRate = data.rates.ZAR;
      localStorage.setItem('aud_zar_rate', currentRate);
    }
  } catch (e) {
    console.log('Using cached rate');
  }
  updateDisplay();
}

function calculateConversion() {
  const inputVal = parseFloat(document.getElementById('amount').value) || 0;
  const resultElement = document.getElementById('result-value');
  
  if (isAudToZar) {
    const converted = inputVal * currentRate;
    resultElement.innerText = `${converted.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} R`;
  } else {
    const converted = inputVal / currentRate;
    resultElement.innerText = `$${converted.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function toggleDirection() {
  isAudToZar = !isAudToZar;
  
  const inputLabel = document.getElementById('input-label');
  const resultLabel = document.getElementById('result-label');
  
  if (isAudToZar) {
    inputLabel.innerText = 'Amount (AUD)';
    resultLabel.innerText = 'Converted Amount (ZAR)';
  } else {
    inputLabel.innerText = 'Amount (ZAR)';
    resultLabel.innerText = 'Converted Amount (AUD)';
  }
  
  updateDisplay();
}

function updateDisplay() {
  const statusElement = document.getElementById('rate-status');
  statusElement.innerText = `Rate: 1 AUD = ${currentRate.toFixed(4)} ZAR`;
  calculateConversion();
}

fetchRate();