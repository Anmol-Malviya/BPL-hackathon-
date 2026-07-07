import { analyzeURL } from './phishingEngine.js';

let threatBlacklistSet = new Set();

// Load cached active threat rules into memory Set on startup for 0ms lookups
function loadBlacklistCache() {
  chrome.storage.local.get(['threatBlacklist'], (res) => {
    const list = res.threatBlacklist || [];
    threatBlacklistSet = new Set(list);
    console.log(`Loaded ${threatBlacklistSet.size} threat blacklist domains into memory.`);
  });
}

loadBlacklistCache();

// Reload cache in memory if rules are synced/updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.threatBlacklist) {
    threatBlacklistSet = new Set(changes.threatBlacklist.newValue || []);
    console.log(`Reloaded threat blacklist cache. Total rules: ${threatBlacklistSet.size}`);
  }
});

// Initialize extension settings, stats, and rule databases
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([
    'shieldingActive',
    'blockSuspicious',
    'bypassList',
    'statsScanned',
    'statsBlocked',
    'ruleCount',
    'lastSyncTime'
  ], (res) => {
    const defaults = {};
    if (res.shieldingActive === undefined) defaults.shieldingActive = true;
    if (res.blockSuspicious === undefined) defaults.blockSuspicious = false;
    if (res.bypassList === undefined) defaults.bypassList = [];
    if (res.statsScanned === undefined) defaults.statsScanned = 0;
    if (res.statsBlocked === undefined) defaults.statsBlocked = 0;
    if (res.ruleCount === undefined) defaults.ruleCount = 0;
    if (res.lastSyncTime === undefined) defaults.lastSyncTime = 0;
    
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults, () => {
        // Trigger first sync in background on installation
        if (!res.lastSyncTime) {
          syncThreatFeeds();
        }
      });
    } else if (!res.lastSyncTime) {
      syncThreatFeeds();
    }
  });
});

// Sync active phishing threat feeds from Phishing.Database
async function syncThreatFeeds() {
  console.log('Initiating active threat database sync...');
  try {
    const response = await fetch('https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const lines = text.split('\n');
    const domains = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('//')) {
        domains.push(line.toLowerCase());
        // Limit to 15,000 domains for optimal performance
        if (domains.length >= 15000) break;
      }
    }

    const timestamp = Date.now();
    await new Promise((resolve) => {
      chrome.storage.local.set({
        threatBlacklist: domains,
        lastSyncTime: timestamp,
        ruleCount: domains.length
      }, resolve);
    });

    console.log(`Threat feed sync complete. Stored ${domains.length} active rules.`);
    return { success: true, count: domains.length, timestamp };
  } catch (e) {
    console.error('Threat feed sync failed:', e);
    return { success: false, error: e.message };
  }
}

// Intercept navigations before they start loading
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept main frame navigations (not iframe loads)
  if (details.frameId !== 0) return;

  const url = details.url;

  // Skip internal/extension pages
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('file://') ||
    url.startsWith('edge://')
  ) {
    return;
  }

  // Get current configurations from storage
  chrome.storage.local.get([
    'shieldingActive',
    'blockSuspicious',
    'bypassList',
    'statsBlocked'
  ], (settings) => {
    const shieldingActive = settings.shieldingActive !== false;
    const blockSuspicious = settings.blockSuspicious === true;
    const bypassList = settings.bypassList || [];

    if (!shieldingActive) {
      incrementScannedCounter();
      return;
    }

    let hostname = '';
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch (e) {
      return;
    }

    // Check if the domain is temporarily bypassed by the user
    if (bypassList.includes(hostname)) {
      return;
    }

    // Run local prediction checks with memory blacklist Set
    const analysis = analyzeURL(url, threatBlacklistSet);

    const isDangerous = analysis.rating === 'DANGEROUS';
    const isSuspicious = analysis.rating === 'SUSPICIOUS';

    // Block if dangerous, or if suspicious and blockSuspicious is enabled
    if (isDangerous || (isSuspicious && blockSuspicious)) {
      // Increment blocked count
      const blockedCount = (settings.statsBlocked || 0) + 1;
      chrome.storage.local.set({ statsBlocked: blockedCount });

      // Redirect to the warning block page
      const warningUrl = chrome.runtime.getURL(
        `warning.html?url=${encodeURIComponent(url)}&score=${analysis.score}&rating=${analysis.rating}`
      );
      
      chrome.tabs.update(details.tabId, { url: warningUrl });
    } else {
      incrementScannedCounter();
    }
  });
});

function incrementScannedCounter() {
  chrome.storage.local.get(['statsScanned'], (res) => {
    const scannedCount = (res.statsScanned || 0) + 1;
    chrome.storage.local.set({ statsScanned: scannedCount });
  });
}

// Update the badge when tab changes or updates
async function updateTabBadge(tabId, url) {
  if (!url || 
      url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') || 
      url.startsWith('about:') || 
      url.startsWith('edge://')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  chrome.storage.local.get(['shieldingActive', 'bypassList'], (settings) => {
    const shieldingActive = settings.shieldingActive !== false;
    const bypassList = settings.bypassList || [];
    
    let hostname = '';
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch (e) {
      chrome.action.setBadgeText({ tabId, text: '' });
      return;
    }

    if (!shieldingActive) {
      chrome.action.setBadgeText({ tabId, text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#475569' });
      return;
    }

    if (bypassList.includes(hostname)) {
      chrome.action.setBadgeText({ tabId, text: 'BP' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#8b5cf6' });
      return;
    }

    const analysis = analyzeURL(url, threatBlacklistSet);

    if (analysis.rating === 'DANGEROUS') {
      chrome.action.setBadgeText({ tabId, text: 'ERR' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#ef4444' });
    } else if (analysis.rating === 'SUSPICIOUS') {
      chrome.action.setBadgeText({ tabId, text: 'WARN' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#f59e0b' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  });
}

// Tab activation listener
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    updateTabBadge(activeInfo.tabId, tab.url);
  });
});

// Tab update listener (e.g. page finished navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateTabBadge(tabId, changeInfo.url);
  } else if (changeInfo.status === 'complete') {
    updateTabBadge(tabId, tab.url);
  }
});

// Listener for runtime messages (headers rules and rules syncing)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'registerSandboxTab') {
    const tabId = message.tabId;
    const ruleId = tabId;

    const rule = {
      id: ruleId,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'x-frame-options', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' },
          { header: 'frame-options', operation: 'remove' }
        ]
      },
      condition: {
        resourceTypes: ['sub_frame'],
        tabIds: [tabId]
      }
    };

    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
      addRules: [rule]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error registering sandbox session rule:', chrome.runtime.lastError);
      } else {
        console.log(`Registered sandbox session rule for tab: ${tabId}`);
      }
    });
  } else if (message.action === 'unregisterSandboxTab') {
    const tabId = message.tabId;
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [tabId]
    });
  } else if (message.action === 'syncThreatIntel') {
    syncThreatFeeds().then((result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
});

// Cleanup session rules when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId]
  });
});
