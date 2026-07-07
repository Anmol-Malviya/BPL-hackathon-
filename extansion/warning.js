import { analyzeURL } from './phishingEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const blockedUrlString = params.get('url') || '';

  if (!blockedUrlString) {
    document.getElementById('blocked-url').textContent = 'unknown site';
    return;
  }

  // Display domain name
  let hostname = blockedUrlString;
  try {
    hostname = new URL(blockedUrlString).hostname;
  } catch (e) {
    // fallback if not a full URL
    hostname = blockedUrlString.split('/')[0];
  }
  document.getElementById('blocked-url').textContent = hostname;

  // Run the full analysis locally
  const analysis = analyzeURL(blockedUrlString);

  // Update safety & risk ratings
  const risk = analysis.riskScore;
  const safety = analysis.score;
  document.getElementById('safety-score').textContent = `${safety}%`;
  document.getElementById('risk-score').textContent = `${risk}%`;

  // Diagnosis status text
  const diagStatus = document.getElementById('diag-status');
  diagStatus.textContent = analysis.rating;
  if (analysis.rating === 'SAFE') {
    diagStatus.className = 'diag-status green';
    diagStatus.style.color = 'var(--color-safe)';
  } else if (analysis.rating === 'SUSPICIOUS') {
    diagStatus.className = 'diag-status orange';
    diagStatus.style.color = 'var(--color-suspicious)';
  } else {
    diagStatus.className = 'diag-status red';
    diagStatus.style.color = 'var(--color-danger)';
  }

  // Populating warnings
  const reasonsList = document.getElementById('reasons-list');
  reasonsList.innerHTML = '';

  if (analysis.warnings && analysis.warnings.length > 0) {
    analysis.warnings.forEach(warning => {
      const li = document.createElement('li');
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'reason-title';
      titleSpan.textContent = warning.title;
      
      const descSpan = document.createElement('span');
      descSpan.className = 'reason-desc';
      descSpan.textContent = warning.desc;
      
      li.appendChild(titleSpan);
      li.appendChild(descSpan);
      reasonsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<span class="reason-title">Local Signature Match Clear</span><span class="reason-desc">No explicit blacklist rules triggered, flagged primarily by machine learning prediction weights.</span>';
    reasonsList.appendChild(li);
  }

  // ML Probability bar loading
  const mlPercent = (analysis.mlProbability * 100).toFixed(2);
  document.getElementById('ml-prob-text').textContent = `${mlPercent}%`;
  
  const fill = document.getElementById('ml-progress-fill');
  fill.style.width = '0%';
  setTimeout(() => {
    fill.style.width = `${mlPercent}%`;
  }, 150);

  // Accordion Details panel
  const toggleBtn = document.getElementById('btn-details-toggle');
  const detailsSec = document.getElementById('details-section');
  const chevron = document.getElementById('chevron-icon');

  toggleBtn.addEventListener('click', () => {
    detailsSec.classList.toggle('hidden');
    chevron.classList.toggle('rotated');
  });

  // Action: Back to safety
  document.getElementById('btn-back').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, navigate to Chrome new tab
      window.location.href = 'chrome://newtab';
    }
  });

  // Action: Open in Sandbox
  document.getElementById('btn-sandbox').addEventListener('click', () => {
    const sandboxUrl = chrome.runtime.getURL(
      `sandbox.html?url=${encodeURIComponent(blockedUrlString)}`
    );
    chrome.tabs.create({ url: sandboxUrl });
  });

  // Action: Proceed anyway
  document.getElementById('btn-proceed').addEventListener('click', () => {
    const domainToBypass = hostname.toLowerCase();
    chrome.storage.local.get(['bypassList'], (result) => {
      const bypassList = result.bypassList || [];
      if (!bypassList.includes(domainToBypass)) {
        bypassList.push(domainToBypass);
        chrome.storage.local.set({ bypassList }, () => {
          window.location.href = blockedUrlString;
        });
      } else {
        window.location.href = blockedUrlString;
      }
    });
  });
});
