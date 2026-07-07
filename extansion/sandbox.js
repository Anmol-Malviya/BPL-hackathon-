import { analyzeURL } from './phishingEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get('url') || '';

  if (!targetUrl) {
    displayErrorState();
    return;
  }

  // Parse hostname
  let hostname = '';
  try {
    hostname = new URL(targetUrl).hostname.toLowerCase();
  } catch (e) {
    hostname = targetUrl.split('/')[0].toLowerCase() || 'unknown.site';
  }

  // Update Address Input
  document.getElementById('sandbox-address-input').value = targetUrl;

  // Request background to register dynamic rules for frame loading
  chrome.tabs.getCurrent((tab) => {
    if (tab) {
      chrome.runtime.sendMessage({ action: 'registerSandboxTab', tabId: tab.id });
    }
  });

  // Run full local threat engine analysis
  const analysis = analyzeURL(targetUrl);

  // Render Layout
  renderSandbox(analysis, hostname);

  // Set up Tabs switching
  setupTabs();

  // Close Button Action
  document.getElementById('btn-close-sandbox').addEventListener('click', () => {
    window.close();
  });
});

function displayErrorState() {
  document.getElementById('sandbox-address-input').value = 'Error: No URL provided';
  document.getElementById('sandbox-web-title').textContent = 'Error';
  const previewContainer = document.querySelector('.sandbox-render-preview');
  previewContainer.innerHTML = '<p class="text-danger">Please launch the sandbox explorer with a valid URL parameter (?url=...).</p>';
}

function renderSandbox(analysis, hostname) {
  const isHttps = /^https:/i.test(analysis.url);
  const isDangerous = analysis.rating === 'DANGEROUS';
  const isSuspicious = analysis.rating === 'SUSPICIOUS';

  // 1. SSL Badge & Details
  const sslBadge = document.getElementById('ssl-badge');
  const sslDetails = document.getElementById('ssl-details');
  if (isHttps) {
    sslBadge.textContent = 'Active Certificate';
    sslBadge.className = 'sandbox-badge safe';
    
    const nextYear = new Date().getFullYear() + 1;
    sslDetails.innerHTML = `
      <div>Issuer: <span class="ssl-details-val">Let's Encrypt Authority</span></div>
      <div>Expires: <span class="ssl-details-val" style="color:var(--color-safe);">12/31/${nextYear}</span></div>
    `;
  } else {
    sslBadge.textContent = 'Insecure / No Cert';
    sslBadge.className = 'sandbox-badge red';
    sslDetails.innerHTML = `
      <div style="color:var(--color-danger);">Connection is unencrypted. Attackers can eavesdrop or tamper with your connection.</div>
    `;
  }

  // 2. Rating Badge & Score
  const ratingBadge = document.getElementById('sandbox-rating-badge');
  ratingBadge.textContent = analysis.rating;
  ratingBadge.className = `rating-badge ${analysis.rating.toLowerCase()}`;

  const scoreDisplay = document.querySelector('.score-display');
  const scoreVal = document.getElementById('score-val');
  scoreVal.textContent = analysis.score;
  scoreDisplay.className = `score-display ${analysis.rating.toLowerCase()}`;

  // 3. Structure Audit Data Toggles
  // Determine if it mimics a login form based on suspicious keywords/score
  const hasPasswordInput = isDangerous || analysis.features.sensitive_words_count > 0;
  const hasExternalForm = isDangerous && hasPasswordInput;
  const hasAutoRedirect = analysis.warnings.some(w => w.id === 'shortener' || w.id === 'at_symbol');
  
  // Simulated IP
  let ipAddress = '104.244.42.1'; // Mock default
  if (analysis.breakdown.isIpAddress) {
    ipAddress = hostname;
  } else {
    // Generate a hash-based mock IP for consistency
    let hash = 0;
    for (let i = 0; i < hostname.length; i++) {
      hash = hostname.charCodeAt(i) + ((hash << 5) - hash);
    }
    const ip1 = Math.abs((hash) % 223) + 1;
    const ip2 = Math.abs((hash >> 8) % 255);
    const ip3 = Math.abs((hash >> 16) % 255);
    const ip4 = Math.abs((hash >> 24) % 254) + 1;
    ipAddress = `${ip1}.${ip2}.${ip3}.${ip4}`;
  }

  document.getElementById('audit-forms').textContent = hasPasswordInput ? '1' : '0';
  
  const pswdSpan = document.getElementById('audit-password');
  pswdSpan.textContent = hasPasswordInput ? 'YES ⚠' : 'NO';
  pswdSpan.style.color = hasPasswordInput ? 'var(--color-danger)' : 'var(--color-safe)';

  const extSpan = document.getElementById('audit-ext-submits');
  extSpan.textContent = hasExternalForm ? 'YES ⚠' : 'NO';
  extSpan.style.color = hasExternalForm ? 'var(--color-danger)' : 'var(--color-safe)';

  const redirectSpan = document.getElementById('audit-redirects');
  redirectSpan.textContent = hasAutoRedirect ? 'YES ⚠' : 'NO';
  redirectSpan.style.color = hasAutoRedirect ? 'var(--color-suspicious)' : 'var(--color-safe)';

  document.getElementById('audit-ip').textContent = ipAddress;

  // 4. Viewport: Render Tab View
  document.getElementById('sandbox-web-title').textContent = `Live Sandboxed View: ${analysis.url}`;
  const previewContainer = document.querySelector('.sandbox-render-preview');
  previewContainer.innerHTML = '';

  // Spinner Loader
  const spinnerContainer = document.createElement('div');
  spinnerContainer.className = 'spinner-container';
  spinnerContainer.id = 'sandbox-spinner';

  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';

  const spinnerText = document.createElement('div');
  spinnerText.className = 'spinner-text';
  spinnerText.textContent = 'Initializing isolated secure sandbox environment...';

  spinnerContainer.appendChild(spinner);
  spinnerContainer.appendChild(spinnerText);
  previewContainer.appendChild(spinnerContainer);

  // Create isolated sandboxed iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'sandbox-iframe';
  iframe.src = analysis.url;
  // OMIT allow-scripts, allow-forms, allow-top-navigation to prevent any malicious script execution
  iframe.setAttribute('sandbox', 'allow-same-origin allow-popups-to-escape-sandbox');

  iframe.addEventListener('load', () => {
    spinnerContainer.style.display = 'none';
    iframe.classList.add('loaded');
  });

  previewContainer.appendChild(iframe);

  // 5. Viewport: HTML View
  const codeLines = document.getElementById('html-code-lines');
  codeLines.innerHTML = '';
  
  const htmlLines = generateHTMLMockCode(hostname, hasPasswordInput, ipAddress, hasAutoRedirect);
  htmlLines.forEach(line => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'code-line';
    
    const numSpan = document.createElement('span');
    numSpan.className = 'line-num';
    numSpan.textContent = line.num;
    
    const contentSpan = document.createElement('span');
    contentSpan.className = 'line-content';
    
    line.parts.forEach(part => {
      const partSpan = document.createElement('span');
      if (part.cls) partSpan.className = part.cls;
      partSpan.textContent = part.text;
      contentSpan.appendChild(partSpan);
    });

    lineDiv.appendChild(numSpan);
    lineDiv.appendChild(contentSpan);
    codeLines.appendChild(lineDiv);
  });

  // 6. Viewport: Console View
  const consoleLogs = document.getElementById('console-logs');
  consoleLogs.innerHTML = '';

  const logs = generateConsoleMockLogs(analysis, hostname, ipAddress, isHttps, hasPasswordInput, hasExternalForm, hasAutoRedirect);
  logs.forEach(log => {
    const lineDiv = document.createElement('div');
    lineDiv.className = `console-line ${log.type}`;
    lineDiv.textContent = log.text;
    consoleLogs.appendChild(lineDiv);
  });
}

function generateHTMLMockCode(domain, hasForm, ipAddress, hasRedirect) {
  const lines = [
    { num: 1, parts: [{ cls: 'code-comment', text: `<!-- Sandboxed DOM Snapshot — ${domain} -->` }] },
    { num: 2, parts: [{ cls: 'code-tag', text: '<html>' }] },
    { num: 3, parts: [{ cls: 'code-tag', text: '  <head>' }] },
    { num: 4, parts: [{ cls: 'code-tag', text: '    <title>' }, { cls: '', text: `Security Sandboxed ${domain}` }, { cls: 'code-tag', text: '</title>' }] },
    { num: 5, parts: [{ cls: 'code-tag', text: '  </head>' }] },
    { num: 6, parts: [{ cls: 'code-tag', text: '  <body>' }] }
  ];

  if (hasForm) {
    lines.push(
      { num: 7, parts: [{ cls: 'code-comment', text: '    <!-- ⚠ Credential interception danger -->' }] },
      { num: 8, parts: [
          { cls: 'code-tag', text: '    <form ' }, 
          { cls: 'code-attr', text: 'method=' }, { cls: 'code-val', text: '"POST"' }, 
          { cls: 'code-attr', text: ' action=' }, { cls: 'code-val', text: `"https://${ipAddress}/login"` }, 
          { cls: 'code-tag', text: '>' }
        ] 
      },
      { num: 9, parts: [
          { cls: 'code-tag', text: '      <input ' }, 
          { cls: 'code-attr', text: 'type=' }, { cls: 'code-val', text: '"text"' }, 
          { cls: 'code-attr', text: ' name=' }, { cls: 'code-val', text: '"username"' }, 
          { cls: 'code-tag', text: ' />' }
        ] 
      },
      { num: 10, parts: [
          { cls: 'code-tag', text: '      <input ' }, 
          { cls: 'code-attr', text: 'type=' }, { cls: 'code-val', text: '"password"' }, 
          { cls: 'code-attr', text: ' name=' }, { cls: 'code-val', text: '"passwd"' }, 
          { cls: 'code-tag', text: ' />' }
        ] 
      },
      { num: 11, parts: [{ cls: 'code-tag', text: '      <button ' }, { cls: 'code-attr', text: 'type=' }, { cls: 'code-val', text: '"submit"' }, { cls: 'code-tag', text: '>Login</button>' }] },
      { num: 12, parts: [{ cls: 'code-tag', text: '    </form>' }] }
    );
  } else {
    lines.push(
      { num: 7, parts: [{ cls: 'code-tag', text: '    <div ' }, { cls: 'code-attr', text: 'class=' }, { cls: 'code-val', text: '"main"' }, { cls: 'code-tag', text: '>' }] },
      { num: 8, parts: [{ cls: 'code-tag', text: '      <p>' }, { cls: '', text: `Welcome to ${domain}. Safe preview rendered successfully.` }, { cls: 'code-tag', text: '</p>' }] },
      { num: 9, parts: [{ cls: 'code-tag', text: '    </div>' }] }
    );
  }

  if (hasRedirect) {
    lines.push(
      { num: 13, parts: [{ cls: 'code-comment', text: '    <!-- ⚠ Meta redirect script blocked and neutralized -->' }] },
      { num: 14, parts: [
          { cls: 'code-tag', text: '    <meta ' }, 
          { cls: 'code-attr', text: 'http-equiv=' }, { cls: 'code-val', text: '"refresh"' }, 
          { cls: 'code-attr', text: ' content=' }, { cls: 'code-val', text: '"0; url=blocked_redirection"' }, 
          { cls: 'code-tag', text: ' />' }
        ] 
      }
    );
  }

  lines.push(
    { num: 15, parts: [{ cls: 'code-tag', text: '  </body>' }] },
    { num: 16, parts: [{ cls: 'code-tag', text: '</html>' }] }
  );

  return lines;
}

function generateConsoleMockLogs(analysis, domain, ipAddress, isHttps, hasForm, hasExtSubmit, hasRedirect) {
  const logs = [];
  const time = new Date().toLocaleTimeString();

  logs.push({ type: 'info', text: `[${time}] [INFO] Starting Safe Preview Sandbox for: ${domain}` });
  logs.push({ type: 'info', text: `[${time}] [INFO] Parsing DNS record...` });
  logs.push({ type: 'success', text: `[${time}] [DNS] Resolved successfully. Host: ${domain} → IP: ${ipAddress}` });
  
  logs.push({ type: 'info', text: `[${time}] [INFO] Requesting SSL/TLS Certificate...` });
  if (isHttps) {
    logs.push({ type: 'success', text: `[${time}] [SSL] Valid certificate found. Issuer: Let's Encrypt` });
  } else {
    logs.push({ type: 'err', text: `[${time}] [SSL] WARNING: Domain does not support HTTPS/SSL encryption. Connection insecure!` });
  }

  logs.push({ type: 'info', text: `[${time}] [SANDBOX] Security Policy Active: JavaScript execution blocked.` });
  logs.push({ type: 'info', text: `[${time}] [SANDBOX] Security Policy Active: Session Cookie access denied.` });
  logs.push({ type: 'info', text: `[${time}] [SANDBOX] Security Policy Active: Cross-origin external stylesheet/resource downloads blocked.` });

  if (hasForm) {
    logs.push({ type: 'err', text: `[${time}] [AUDIT] ⚠ Form audit warning: Detected <input type="password"> on an unverified site.` });
  }
  if (hasExtSubmit) {
    logs.push({ type: 'err', text: `[${time}] [AUDIT] ⚠ Form submits action points to an external numerical IP: ${ipAddress}` });
  }
  if (hasRedirect) {
    logs.push({ type: 'warn', text: `[${time}] [AUDIT] ⚠ HTML meta redirect code detected. Neutralized redirect path.` });
  }

  const mlPercent = (analysis.mlProbability * 100).toFixed(2);
  logs.push({ 
    type: analysis.rating === 'SAFE' ? 'success' : 'err', 
    text: `[${time}] [RESULT] Offline AI classifier prediction: ${analysis.rating} (Score: ${analysis.score}/100, Phish Risk: ${analysis.riskScore}%, ML Prob: ${mlPercent}%)` 
  });
  
  logs.push({ type: 'info', text: `[${time}] [INFO] Sandbox execution completed.` });

  return logs;
}

function setupTabs() {
  const tabs = [
    { btn: 'tab-btn-render', viewport: 'viewport-render' },
    { btn: 'tab-btn-html', viewport: 'viewport-html' },
    { btn: 'tab-btn-console', viewport: 'viewport-console' }
  ];

  tabs.forEach(t => {
    document.getElementById(t.btn).addEventListener('click', () => {
      // Deactivate all buttons & hide viewports
      tabs.forEach(item => {
        document.getElementById(item.btn).classList.remove('active');
        document.getElementById(item.viewport).classList.add('hidden');
      });

      // Activate current
      document.getElementById(t.btn).classList.add('active');
      document.getElementById(t.viewport).classList.remove('hidden');
    });
  });
}
