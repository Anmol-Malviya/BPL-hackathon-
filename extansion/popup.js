import { analyzeURL } from './phishingEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  // SVG circular progress ring variables
  const progressRing = document.getElementById('progress-ring-fill');
  const circumference = 2 * Math.PI * 50; // Radius = 50 -> 314.159

  // Initialize progress ring settings
  progressRing.style.strokeDasharray = `${circumference}`;
  progressRing.style.strokeDashoffset = `${circumference}`;

  // Query the current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      displayUnknownState();
      return;
    }

    const currentTab = tabs[0];
    const url = currentTab.url || '';

    // Check if it is a system/special page
    if (!url || 
        url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('about:') || 
        url.startsWith('edge://')) {
      displaySystemPageState();
      return;
    }

    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch (e) {
      hostname = url.split('/')[0];
    }

    document.getElementById('domain-text').textContent = hostname;

    // Run local machine learning + heuristics checks
    const analysis = analyzeURL(url);
    renderAnalysis(analysis, circumference);

    // Configure the sandbox preview button
    const sandboxBtn = document.getElementById('btn-open-sandbox');
    sandboxBtn.classList.remove('hidden');
    sandboxBtn.addEventListener('click', () => {
      const sandboxUrl = chrome.runtime.getURL(`sandbox.html?url=${encodeURIComponent(url)}`);
      chrome.tabs.create({ url: sandboxUrl });
    });
  });

  // Load settings and statistics
  loadSettingsAndStats();

  // Bind settings listeners
  bindToggleSettings();

  // Whitelist manager bindings
  loadWhitelist();
  document.getElementById('btn-clear-whitelist').addEventListener('click', clearWhitelist);

  // Threat Intel Sync bindings
  loadThreatSyncInfo();
  bindSyncThreatIntel();
});

function displayUnknownState() {
  document.getElementById('domain-text').textContent = 'Unable to access tab';
  document.getElementById('score-text').textContent = '--';
  document.getElementById('quick-diagnosis').textContent = 'Active tab URL could not be read.';
}

function displaySystemPageState() {
  document.getElementById('domain-text').textContent = 'Browser System Page';
  document.getElementById('score-text').textContent = '100';
  
  const progressRing = document.getElementById('progress-ring-fill');
  progressRing.style.strokeDashoffset = '0';
  progressRing.style.stroke = 'var(--color-safe)';

  const ratingBadge = document.getElementById('status-rating-badge');
  ratingBadge.className = 'rating-badge safe';
  ratingBadge.textContent = 'TRUSTED';

  const label = document.querySelector('.score-label');
  label.textContent = 'SAFE';

  document.getElementById('quick-diagnosis').textContent = 'This is a secure internal browser resource.';
  document.getElementById('warnings-card').classList.add('hidden');
}

function renderAnalysis(analysis, circumference) {
  const scoreText = document.getElementById('score-text');
  const label = document.querySelector('.score-label');
  const ratingBadge = document.getElementById('status-rating-badge');
  const progressRing = document.getElementById('progress-ring-fill');
  const diagnosis = document.getElementById('quick-diagnosis');

  const score = analysis.score; // Safety score (100 - risk)
  scoreText.textContent = score;

  // Set ring offset
  const offset = circumference * (1 - score / 100);
  progressRing.style.strokeDashoffset = offset;

  // Render colors and text based on rating
  if (analysis.rating === 'SAFE') {
    progressRing.style.stroke = 'var(--color-safe)';
    ratingBadge.className = 'rating-badge safe';
    ratingBadge.textContent = 'SAFE SITE';
    label.textContent = 'SAFE';
    label.style.color = 'var(--color-safe)';
    diagnosis.textContent = 'No threat indicators or typosquatting signatures detected.';
    document.getElementById('warnings-card').classList.add('hidden');
  } else if (analysis.rating === 'SUSPICIOUS') {
    progressRing.style.stroke = 'var(--color-suspicious)';
    ratingBadge.className = 'rating-badge suspicious';
    ratingBadge.textContent = 'SUSPICIOUS';
    label.textContent = 'WARN';
    label.style.color = 'var(--color-suspicious)';
    diagnosis.textContent = 'Caution: Potential typosquatting or layout anomalies flagged.';
    renderWarnings(analysis.warnings);
  } else {
    progressRing.style.stroke = 'var(--color-danger)';
    ratingBadge.className = 'rating-badge dangerous';
    ratingBadge.textContent = 'DANGEROUS';
    label.textContent = 'DANGER';
    label.style.color = 'var(--color-danger)';
    diagnosis.textContent = 'Warning: This URL triggered phishing rules or high ML prediction weights.';
    renderWarnings(analysis.warnings);
  }
}

function renderWarnings(warnings) {
  const warningsCard = document.getElementById('warnings-card');
  const countBadge = document.getElementById('warnings-count');
  const listElement = document.getElementById('popup-warnings-list');

  listElement.innerHTML = '';
  
  if (warnings && warnings.length > 0) {
    warningsCard.classList.remove('hidden');
    countBadge.textContent = warnings.length;

    warnings.forEach(warning => {
      const li = document.createElement('li');
      const titleSpan = document.createElement('span');
      titleSpan.className = 'warning-item-title';
      titleSpan.textContent = warning.title;
      
      const textNode = document.createTextNode(warning.desc);
      
      li.appendChild(titleSpan);
      li.appendChild(textNode);
      listElement.appendChild(li);
    });
  } else {
    // If flagged dangerous by ML only with no warnings
    warningsCard.classList.remove('hidden');
    countBadge.textContent = '1';
    
    const li = document.createElement('li');
    li.innerHTML = '<span class="warning-item-title">AI Engine Prediction</span>Flagged by machine learning classification patterns.';
    listElement.appendChild(li);
  }
}

function loadSettingsAndStats() {
  chrome.storage.local.get([
    'shieldingActive',
    'blockSuspicious',
    'statsScanned',
    'statsBlocked'
  ], (res) => {
    const shieldingActive = res.shieldingActive !== false;
    const blockSuspicious = res.blockSuspicious === true;

    document.getElementById('toggle-shielding').checked = shieldingActive;
    document.getElementById('toggle-suspicious').checked = blockSuspicious;
    
    updateShieldHeaderBadge(shieldingActive);

    // Render Stats
    document.getElementById('stat-scanned').textContent = res.statsScanned || 0;
    document.getElementById('stat-blocked').textContent = res.statsBlocked || 0;
  });
}

function updateShieldHeaderBadge(active) {
  const headerBadge = document.getElementById('shield-active-badge');
  if (active) {
    headerBadge.textContent = 'SHIELD ON';
    headerBadge.className = 'badge-status active';
  } else {
    headerBadge.textContent = 'SHIELD OFF';
    headerBadge.className = 'badge-status inactive';
  }
}

function bindToggleSettings() {
  const toggleShield = document.getElementById('toggle-shielding');
  const toggleSuspicious = document.getElementById('toggle-suspicious');

  toggleShield.addEventListener('change', (e) => {
    const active = e.target.checked;
    chrome.storage.local.set({ shieldingActive: active }, () => {
      updateShieldHeaderBadge(active);
      
      // Update badge on active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.runtime.sendMessage({ action: 'triggerBadgeUpdate' }); // Optional fallback, badge updates on tab switches or loads
        }
      });
    });
  });

  toggleSuspicious.addEventListener('change', (e) => {
    chrome.storage.local.set({ blockSuspicious: e.target.checked });
  });
}

function loadWhitelist() {
  const listElement = document.getElementById('whitelist-list');
  const whitelistCard = document.getElementById('whitelist-card');

  chrome.storage.local.get(['bypassList'], (res) => {
    const bypassList = res.bypassList || [];
    listElement.innerHTML = '';

    if (bypassList.length > 0) {
      whitelistCard.classList.remove('hidden');
      
      bypassList.forEach(domain => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = domain;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-whitelist';
        removeBtn.innerHTML = '&#x2715;'; // X mark
        removeBtn.title = 'Remove whitelist bypass';
        removeBtn.addEventListener('click', () => {
          removeDomainFromWhitelist(domain);
        });

        li.appendChild(span);
        li.appendChild(removeBtn);
        listElement.appendChild(li);
      });
    } else {
      whitelistCard.classList.add('hidden');
    }
  });
}

function removeDomainFromWhitelist(domain) {
  chrome.storage.local.get(['bypassList'], (res) => {
    let bypassList = res.bypassList || [];
    bypassList = bypassList.filter(d => d !== domain);
    
    chrome.storage.local.set({ bypassList }, () => {
      loadWhitelist();
    });
  });
}

function clearWhitelist() {
  chrome.storage.local.set({ bypassList: [] }, () => {
    loadWhitelist();
  });
}

function loadThreatSyncInfo() {
  chrome.storage.local.get(['ruleCount', 'lastSyncTime'], (res) => {
    const count = res.ruleCount || 0;
    const time = res.lastSyncTime || 0;
    
    document.getElementById('sync-rules-count').textContent = count.toLocaleString();
    
    const timeText = document.getElementById('sync-time-text');
    if (time === 0) {
      timeText.textContent = 'Never';
    } else {
      const date = new Date(time);
      timeText.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  });
}

function bindSyncThreatIntel() {
  const syncBtn = document.getElementById('btn-sync-intel');
  const statusText = document.getElementById('sync-status');
  
  syncBtn.addEventListener('click', () => {
    syncBtn.disabled = true;
    syncBtn.style.opacity = '0.5';
    statusText.textContent = 'Syncing rules database (fetching Phishing.Database)...';
    statusText.className = 'sync-status text-muted';
    statusText.style.color = '';
    
    chrome.runtime.sendMessage({ action: 'syncThreatIntel' }, (response) => {
      syncBtn.disabled = false;
      syncBtn.style.opacity = '1';
      
      if (chrome.runtime.lastError || !response || !response.success) {
        const errMsg = (response && response.error) || 'Connection timeout';
        statusText.textContent = `Sync failed: ${errMsg}`;
        statusText.style.color = 'var(--color-danger)';
      } else {
        statusText.textContent = `Successfully updated! Cached ${response.count.toLocaleString()} rules.`;
        statusText.style.color = 'var(--color-safe)';
        
        // Reload values
        loadThreatSyncInfo();
        
        // Return text to normal after 3 seconds
        setTimeout(() => {
          statusText.textContent = 'Local threat intelligence database loaded.';
          statusText.style.color = '';
        }, 3000);
      }
    });
  });
}
