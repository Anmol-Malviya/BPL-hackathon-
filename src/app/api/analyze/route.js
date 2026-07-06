import { NextResponse } from 'next/server';
import dns from 'dns';
import https from 'https';

// Helper to resolve DNS hostname
function resolveDNS(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        resolve({ active: false, ip: null, error: err.code });
      } else {
        resolve({ active: true, ip: address, family });
      }
    });
  });
}

// Helper to get SSL Certificate details
function getSSLCertDetails(hostname) {
  return new Promise((resolve) => {
    let completed = false;

    const req = https.request({
      hostname,
      port: 443,
      method: 'GET',
      path: '/',
      rejectUnauthorized: false, // Permit self-signed so we can analyze them
      timeout: 3000,
      agent: false
    }, (res) => {
      if (completed) return;
      completed = true;
      const cert = res.socket.getPeerCertificate(true);
      
      if (cert && Object.keys(cert).length > 0) {
        resolve({
          hasCert: true,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown Issuer',
          subject: cert.subject?.CN || hostname,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          isExpired: new Date() > new Date(cert.valid_to),
          isSelfSigned: cert.issuer?.CN === cert.subject?.CN
        });
      } else {
        resolve({ hasCert: false, error: 'No certificate details returned' });
      }
      req.destroy();
    });

    req.on('error', (err) => {
      if (completed) return;
      completed = true;
      resolve({ hasCert: false, error: err.message });
    });

    req.on('timeout', () => {
      if (completed) return;
      completed = true;
      resolve({ hasCert: false, error: 'Connection timeout' });
      req.destroy();
    });

    req.end();
  });
}

// Helper to analyze Page HTML for password fields / suspicious forms
async function fetchAndAnalyzeHTML(urlString) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PhishGuard/1.0'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, status: response.status };
    }

    const html = await response.text();
    
    // Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No Title Found';

    // Count Forms and Password Inputs
    const hasPasswordInput = /<input[^>]*type=["']password["']/i.test(html);
    
    // Count login forms
    const loginFormsCount = (html.match(/<form[^>]*>/gi) || []).length;
    
    // Check for suspicious redirects in meta or script
    const hasMetaRedirect = /http-equiv=["']refresh["']/i.test(html);
    const hasScriptRedirect = /window\.location|document\.location|location\.replace/i.test(html);

    // Look for external form submission (submitting credentials to another domain)
    const hasExternalForm = /<form[^>]*action=["']https?:\/\/(?![^"'>]*\.?self\.domain)[^"'>]+["']/i.test(html);

    return {
      success: true,
      title,
      hasPasswordInput,
      loginFormsCount,
      hasMetaRedirect,
      hasScriptRedirect,
      hasExternalForm
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let hostname = '';
    try {
      hostname = new URL(cleanUrl).hostname;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Run analyses in parallel
    const [dnsResult, sslResult, pageAnalysis] = await Promise.all([
      resolveDNS(hostname),
      getSSLCertDetails(hostname),
      fetchAndAnalyzeHTML(cleanUrl)
    ]);

    return NextResponse.json({
      hostname,
      dns: dnsResult,
      ssl: sslResult,
      page: pageAnalysis
    });

  } catch (err) {
    console.error('Error in deep scan API:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
