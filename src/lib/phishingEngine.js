import modelWeights from './phishing_model_weights.json';

// Levenshtein distance to check typosquatting (memoized for high performance)
const levenshteinCache = {};
function getLevenshteinDistance(a, b) {
  const key = `${a}:${b}`;
  if (levenshteinCache[key] !== undefined) return levenshteinCache[key];
  const revKey = `${b}:${a}`;
  if (levenshteinCache[revKey] !== undefined) return levenshteinCache[revKey];

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const result = matrix[b.length][a.length];
  levenshteinCache[key] = result;
  return result;
}


// Shannon Entropy calculation for domain string
function calculateShannonEntropy(str) {
  const len = str.length;
  if (len === 0) return 0;
  
  const freqs = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const char in freqs) {
    const p = freqs[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

// Extract features as expected by the Kaggle model
export function extractModelFeatures(urlString) {
  const url = urlString.trim();
  
  // 1. is_https
  const is_https = /^https:\/\//i.test(url) ? 1 : 0;
  
  // Parse host
  let host = '';
  try {
    let urlToParse = url;
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }
    const parsedUrl = new URL(urlToParse);
    host = parsedUrl.hostname.toLowerCase();
  } catch (e) {
    host = url.split('/')[0] || '';
  }
  
  if (host.includes(':')) {
    host = host.split(':')[0];
  }
  
  // 2. url_length
  const url_length = url.length;
  
  // 3. domain_length
  const domain_length = host.length;
  
  // 4. is_ip
  const is_ip = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ? 1 : 0;
  
  // 5. tld_length & subdomain_count
  let tld_length = 0;
  let subdomain_count = 0;
  if (host && !is_ip) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      tld_length = parts[parts.length - 1].length;
      subdomain_count = Math.max(0, parts.length - 2);
    }
  }
  
  // Count character types in URL
  let letters = 0;
  let digits = 0;
  for (let i = 0; i < url.length; i++) {
    const c = url[i];
    if (/[a-zA-Z]/.test(c)) {
      letters++;
    } else if (/[0-9]/.test(c)) {
      digits++;
    }
  }
  const special = url.length - letters - digits;
  
  // Delimiter counts
  const equals_count = (url.match(/=/g) || []).length;
  const qmark_count = (url.match(/\?/g) || []).length;
  const amp_count = (url.match(/&/g) || []).length;
  const hyphen_count = (url.match(/-/g) || []).length;
  const dots_count = (url.match(/\./g) || []).length;
  const slash_count = (url.match(/\//g) || []).length;
  
  // Ratios
  const letter_ratio = url_length > 0 ? letters / url_length : 0;
  const digit_ratio = url_length > 0 ? digits / url_length : 0;
  const special_ratio = url_length > 0 ? special / url_length : 0;

  // UI-compatibility fields
  const nb_dots = dots_count;
  const isHttps = is_https;
  const sensitiveWords = [
    'confirm', 'account', 'banking', 'secure', 'login', 'signin', 
    'verify', 'webscr', 'ebayisapi', 'update', 'password', 'credential',
    'wallet', 'auth', 'recover', 'claim', 'free', 'gift', 'award'
  ];
  let sensitive_words_count = 0;
  const lowerUrl = url.toLowerCase();
  sensitiveWords.forEach(word => {
    let pos = lowerUrl.indexOf(word);
    while (pos !== -1) {
      sensitive_words_count++;
      pos = lowerUrl.indexOf(word, pos + 1);
    }
  });
  
  return {
    url_length,
    domain_length,
    is_ip,
    tld_length,
    subdomain_count,
    is_https,
    letters,
    letter_ratio,
    digits,
    digit_ratio,
    special,
    special_ratio,
    equals_count,
    qmark_count,
    amp_count,
    hyphen_count,
    dots_count,
    slash_count,
    nb_dots,
    isHttps,
    sensitive_words_count
  };
}

// Top brand names to check for typosquatting / hijacking
const TOP_BRANDS = [
  'google.com', 'facebook.com', 'apple.com', 'microsoft.com', 
  'amazon.com', 'netflix.com', 'paypal.com', 'instagram.com', 
  'twitter.com', 'yahoo.com', 'linkedin.com', 'zoom.us', 
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
  'github.com', 'gmail.com', 'outlook.com', 'coinbase.com', 
  'binance.com', 'metamask.io'
];

const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 
  'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'rebrand.ly'
];

// Detect IDN homograph attack
function detectIDNHomograph(hostname) {
  if (!hostname) return null;
  const lowerHost = hostname.toLowerCase();
  
  // Punycode identifier
  const isPunycode = lowerHost.split('.').some(part => part.startsWith('xn--'));
  
  // Character ranges (Cyrillic: \u0400-\u04FF, Greek: \u0370-\u03FF)
  const hasCyrillic = /[\u0400-\u04FF]/.test(lowerHost);
  const hasGreek = /[\u0370-\u03FF]/.test(lowerHost);
  const hasLatin = /[a-z0-9]/.test(lowerHost);

  // Cyrillic lookalikes map to standard Latin characters
  const cyrillicToLatinMap = {
    'а': 'a', // Cyrillic small letter a
    'с': 'c', // Cyrillic small letter es
    'е': 'e', // Cyrillic small letter ie
    'ѕ': 's', // Cyrillic small letter dze
    'і': 'i', // Cyrillic small letter byelorussian-ukrainian i
    'ј': 'j', // Cyrillic small letter je
    'о': 'o', // Cyrillic small letter o
    'р': 'p', // Cyrillic small letter er
    'у': 'y', // Cyrillic small letter u
    'х': 'x', // Cyrillic small letter ha
    'є': 'e', // Cyrillic small letter ukrainian ie
    'ї': 'i'  // Cyrillic small letter yi
  };

  let decodedHost = lowerHost;
  
  // If Punycode or mixed scripts (e.g. Cyrillic characters mixed with Latin)
  if (isPunycode || (hasCyrillic && hasLatin) || (hasGreek && hasLatin)) {
    // Construct a visual "English lookalike representation"
    let replacement = '';
    let hasLookalikes = false;
    for (let i = 0; i < lowerHost.length; i++) {
      const char = lowerHost[i];
      if (cyrillicToLatinMap[char]) {
        replacement += cyrillicToLatinMap[char];
        hasLookalikes = true;
      } else {
        replacement += char;
      }
    }
    
    return {
      isAttack: true,
      type: isPunycode ? 'Punycode Obfuscation (IDN)' : 'Mixed-Script Homograph',
      lookalikeRepresentation: hasLookalikes ? replacement : null,
      explanation: isPunycode 
        ? 'The domain is registered as an Internationalized Domain Name (Punycode). This is often used to hide characters from other alphabets that look exactly like English letters.'
        : 'The domain mixes English characters with identical-looking Cyrillic or Greek characters. Real brands never mix character sets.'
    };
  }
  return null;
}

// Helper to extract the primary registered brand domain name (handling multi-part TLDs like .co.uk)
function extractPrimaryDomainName(hostname) {
  if (!hostname) return '';
  const domainParts = hostname.replace(/^www\./, '').split('.');
  if (domainParts.length < 2) return hostname;
  
  const lastPart = domainParts[domainParts.length - 1];
  const secondLastPart = domainParts[domainParts.length - 2];
  
  const commonRegistryTlds = ['co', 'com', 'org', 'net', 'gov', 'edu', 'asn', 'id', 'ac'];
  const isMultiPartSuffix = lastPart.length === 2 && commonRegistryTlds.includes(secondLastPart);
  
  if (isMultiPartSuffix && domainParts.length >= 3) {
    return domainParts[domainParts.length - 3];
  } else {
    return domainParts[domainParts.length - 2];
  }
}

// Perform complete security check (ML Model + Custom Heuristics)
export function analyzeURL(urlString) {
  const url = urlString.trim();
  
  if (!url) {
    return {
      isValid: false,
      score: 100,
      rating: 'SAFE',
      details: ['Please enter a URL to check.']
    };
  }

  // Parse URL components
  let parsedUrl = null;
  let hostname = '';
  let path = '';
  let protocol = '';
  let isIpAddress = false;
  
  try {
    let urlToParse = url;
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse; // Default to HTTPS for parsing
    }
    parsedUrl = new URL(urlToParse);
    hostname = parsedUrl.hostname.toLowerCase();
    path = parsedUrl.pathname;
    protocol = parsedUrl.protocol;
  } catch (e) {
    hostname = url.split('/')[0].toLowerCase();
    path = url.substring(hostname.length);
  }

  // 1. Whitelist Check (Instantly Safe)
  const isWhitelisted = TOP_BRANDS.some(brand => {
    // Matches exact domain or subdomains: e.g. "google.com" or "accounts.google.com"
    return hostname === brand || hostname.endsWith('.' + brand);
  });

  const hasHttps = /^https:/i.test(protocol || url);

  if (isWhitelisted && hasHttps) {
    return {
      isValid: true,
      url,
      domain: hostname,
      score: 100, // 100% safe
      riskScore: 0,
      rating: 'SAFE',
      mlProbability: 0.0,
      warnings: [],
      safeIndicators: [
        'Verified Domain: This is an official domain of a verified high-trust brand.',
        'SSL/HTTPS connection is active (encrypted).'
      ],
      features: extractModelFeatures(url),
      breakdown: {
        protocol: { text: 'https', isSafe: true },
        hostname: hostname,
        subdomains: hostname.replace(/^www\./, '').split('.').slice(0, -2).filter(Boolean),
        primaryDomainName: extractPrimaryDomainName(hostname),
        path: path,
        isIpAddress: false,
        isShortened: false,
        typosquatTarget: null,
        brandAbuseTriggered: false
      }
    };
  }

  // 2. Extract features & Calculate Normalized ML Model Prediction
  const features = extractModelFeatures(url);
  
  let z = modelWeights.bias;
  modelWeights.features.forEach((feat, idx) => {
    // Standardize: (x - mean) / std
    const mean = modelWeights.means[feat] || 0;
    const std = modelWeights.stds[feat] || 1;
    const norm_val = (features[feat] - mean) / std;
    z += norm_val * modelWeights.weights[idx];
  });
  
  const mlProbability = 1 / (1 + Math.exp(-z));
  
  // 3. Custom Heuristics Analysis
  const warnings = [];
  const safeIndicators = [];
  let riskScore = 0; // 0 is safe, 100 is dangerous

  // Heuristics Check 1: HTTPS Check
  if (!hasHttps) {
    warnings.push({
      id: 'no_https',
      title: 'Insecure Connection (HTTP)',
      desc: 'The website does not use SSL/HTTPS encryption. Phishing sites often use HTTP, although many now use free SSL certificates.',
      severity: 'medium',
      value: 20
    });
    riskScore += 20;
  } else {
    safeIndicators.push('SSL/HTTPS connection is active (encrypted).');
  }

  // Heuristics Check 2: IP Address as host
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipPattern.test(hostname)) {
    isIpAddress = true;
    warnings.push({
      id: 'ip_address',
      title: 'IP Address Used as Domain',
      desc: 'The URL uses an IP address instead of a friendly domain name. This is a very common phishing tactic to hide identity.',
      severity: 'high',
      value: 35
    });
    riskScore += 35;
  }

  // Heuristics Check 3: Shortening Service
  const isShortened = SHORTENERS.some(shortener => hostname === shortener || hostname.endsWith('.' + shortener));
  if (isShortened) {
    warnings.push({
      id: 'shortener',
      title: 'URL Shortening Service Detected',
      desc: 'Uses a link shortener service. Phishing messages use these to hide the actual landing page.',
      severity: 'medium',
      value: 20
    });
    riskScore += 20;
  }

  // Heuristics Check 4: Typosquatting / Homograph / Brand Abuse
  let typosquatTarget = null;
  let minDistance = 999;
  let brandAbuseTriggered = false;
  
  if (!isIpAddress && hostname) {
    const primaryName = extractPrimaryDomainName(hostname);

    // Check if the domain contains a brand name but is NOT the brand's official site
    TOP_BRANDS.forEach(brand => {
      const brandRaw = brand.split('.')[0];
      // If it contains the brand name (e.g. 'paypal' in 'secure-paypal-login.com')
      if (hostname.includes(brandRaw) && !hostname.endsWith('.' + brand) && hostname !== brand) {
        brandAbuseTriggered = true;
        typosquatTarget = brand;
      }
    });

    // If brand hijacking didn't trigger, check Levenshtein distance on the primary domain name
    if (!brandAbuseTriggered) {
      TOP_BRANDS.forEach(brand => {
        const brandRaw = brand.split('.')[0];
        if (primaryName !== brandRaw) {
          const dist = getLevenshteinDistance(primaryName, brandRaw);
          if (dist > 0 && dist <= 2) {
            if (dist < minDistance) {
              minDistance = dist;
              typosquatTarget = brand;
            }
          }
        }
      });
    }

    if (typosquatTarget) {
      const desc = brandAbuseTriggered 
        ? `The domain contains the brand name '${typosquatTarget.split('.')[0]}' but is not the official brand website. This is a common tactic to hijack brand trust.` 
        : `The domain name closely mimics a highly visited website (${typosquatTarget}). This is a major phishing technique (typosquatting).`;
      
      warnings.push({
        id: 'typosquatting',
        title: brandAbuseTriggered ? 'Brand Spoofing / Hijacking' : 'Potential Typo-squatting Detected',
        desc: desc,
        severity: 'high',
        value: 45
      });
      riskScore += 50;
    }
  }

  // Heuristics Check 5: Sensitive Keywords in host or path
  const sensitiveKeywords = ['login', 'signin', 'secure', 'verify', 'update', 'banking', 'account', 'wallet', 'auth', 'recovery', 'free', 'gift', 'prize', 'credential'];
  const matchedKeywords = [];
  
  // Check hostname (both subdomains and primary domain)
  sensitiveKeywords.forEach(kw => {
    if (hostname.includes(kw)) {
      matchedKeywords.push(kw);
    }
  });
  
  // Check path for sensitive keywords
  sensitiveKeywords.forEach(kw => {
    if (path.toLowerCase().includes(kw)) {
      if (!matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }
  });

  if (matchedKeywords.length > 0) {
    warnings.push({
      id: 'keywords',
      title: 'Suspicious Keywords Detected',
      desc: `Contains security or urgency keywords (${matchedKeywords.join(', ')}) designed to trick you into entering credentials.`,
      severity: 'medium',
      value: 15 * Math.min(matchedKeywords.length, 3)
    });
    riskScore += 15 * Math.min(matchedKeywords.length, 3);
  }

  // Heuristics Check 6: Shannon Entropy Check (random characters)
  if (!isIpAddress && hostname) {
    const primaryName = extractPrimaryDomainName(hostname);
    const entropy = calculateShannonEntropy(primaryName);
    
    if (primaryName.length > 8 && entropy > 4.1) {
      warnings.push({
        id: 'high_entropy',
        title: 'High Randomness in Domain Name',
        desc: `The domain name contains highly random characters (Entropy: ${entropy.toFixed(2)}), suggesting it was auto-generated by a script.`,
        severity: 'medium',
        value: 15
      });
      riskScore += 15;
    }
  }

  // Heuristics Check 7: Too many subdomains / dots
  const dotCount = (hostname.match(/\./g) || []).length;
  if (dotCount > 3) {
    warnings.push({
      id: 'many_subdomains',
      title: 'Excessive Subdomains',
      desc: 'The URL has an unusually high number of subdomains. Attackers stack subdomains to make fake URLs look authentic.',
      severity: 'medium',
      value: 15
    });
    riskScore += 15;
  }

  // Heuristics Check 8: @ symbol in URL
  if (url.includes('@')) {
    warnings.push({
      id: 'at_symbol',
      title: 'Contains "@" Symbol',
      desc: 'The "@" symbol in a URL causes the browser to ignore everything before it. Attackers use this to display fake domain names.',
      severity: 'high',
      value: 30
    });
    riskScore += 30;
  }

  // Heuristics Check 9: IDN Homograph Attack Check
  const homographResult = detectIDNHomograph(hostname);
  if (homographResult) {
    warnings.push({
      id: 'homograph_attack',
      title: homographResult.type,
      desc: homographResult.explanation + (homographResult.lookalikeRepresentation ? ` Visually mimics: ${homographResult.lookalikeRepresentation}` : ''),
      severity: 'high',
      value: 60
    });
    riskScore += 60;
  }

  // Heuristics Check 10: Suspicious Top-Level Domains (TLDs)
  const SUSPICIOUS_TLDS = [
    'zip', 'mov', 'fit', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 
    'click', 'download', 'racing', 'stream', 'win', 'bid', 'vip', 'xyz',
    'ru', 'cn', 'su', 'buzz', 'date', 'icu', 'loan', 'men', 'xin'
  ];
  if (hostname && !isIpAddress) {
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    if (tld && SUSPICIOUS_TLDS.includes(tld)) {
      warnings.push({
        id: 'suspicious_tld',
        title: `Suspicious TLD (.${tld})`,
        desc: `The Top-Level Domain '.${tld}' is frequently used for malicious activities, phishing, and distributing malware.`,
        severity: 'medium',
        value: 20
      });
      riskScore += 20;
    }
  }

  // Calculate final score
  // If no major threat warnings are present, we bound the prediction.
  // We integrate the normalized ML prediction with the custom risk score.
  const mlScore = Math.round(mlProbability * 100);
  
  // Combine logic:
  // If the ML score is high and we have warning flags, they amplify each other.
  // If there are no warning flags and it's a standard URL structure, we damp the ML score.
  let finalScore = 0;
  if (warnings.length > 0) {
    finalScore = Math.max(riskScore, mlScore);
  } else {
    // Damp the ML score if no heuristics triggered and it didn't flag keywords/typosquatting
    finalScore = Math.min(mlScore, 20); // Cap at 20 (Safe) if no warnings triggered
  }

  // Cap finalScore at 100 and min at 0
  finalScore = Math.min(Math.max(finalScore, 0), 100);

  // Safety rating calculation
  let rating = 'SAFE';
  if (finalScore >= 70) {
    rating = 'DANGEROUS';
  } else if (finalScore >= 35) {
    rating = 'SUSPICIOUS';
  }

  if (warnings.length === 0) {
    safeIndicators.push('No obvious phishing indicators or typosquatting patterns detected.');
    safeIndicators.push('Domain structure and keywords checks passed.');
  }

  return {
    isValid: true,
    url,
    domain: hostname,
    score: 100 - finalScore, // Safety score is 100 - risk
    riskScore: finalScore,
    rating,
    mlProbability: parseFloat(mlProbability.toFixed(4)),
    warnings,
    safeIndicators,
    features, // Expose raw extracted features for details UI
    breakdown: {
      protocol: {
        text: protocol ? protocol.replace(':', '') : (hasHttps ? 'https' : 'http'),
        isSafe: hasHttps
      },
      hostname: hostname,
      subdomains: hostname.replace(/^www\./, '').split('.').slice(0, -2).filter(Boolean),
      primaryDomainName: extractPrimaryDomainName(hostname),
      path: path,
      isIpAddress: isIpAddress,
      isShortened: isShortened,
      typosquatTarget: typosquatTarget,
      brandAbuseTriggered: brandAbuseTriggered
    }
  };
}

// Perform Email Header analysis
export function analyzeEmailHeaders(rawHeaders) {
  if (!rawHeaders || !rawHeaders.trim()) {
    return {
      isValid: false,
      score: 100,
      warnings: ['Please enter email headers to analyze.']
    };
  }

  const lines = rawHeaders.split('\n');
  const headers = {};
  
  // Simple multi-line header parser
  let currentHeader = null;
  lines.forEach(line => {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentHeader) {
        headers[currentHeader] += ' ' + line.trim();
      }
    } else {
      const match = line.match(/^([A-Za-z0-9\-]+):\s*(.*)$/);
      if (match) {
        currentHeader = match[1].toLowerCase();
        headers[currentHeader] = match[2].trim();
      }
    }
  });

  const warnings = [];
  const safeIndicators = [];
  let riskScore = 0;

  // Extract critical headers
  const fromHeader = headers['from'] || '';
  const returnPathHeader = headers['return-path'] || '';
  const replyToHeader = headers['reply-to'] || '';
  const authResults = headers['authentication-results'] || '';
  const receivedSpf = headers['received-spf'] || '';
  const subject = headers['subject'] || '';
  const messageId = headers['message-id'] || '';

  // 1. From & Return-Path Domain Discrepancy
  const fromEmailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const fromEmail = fromEmailMatch ? fromEmailMatch[1] : '';
  const fromDomain = fromEmail ? fromEmail.split('@')[1]?.toLowerCase() : '';

  const returnPathEmailMatch = returnPathHeader.match(/<([^>]+)>/) || returnPathHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const returnPathEmail = returnPathEmailMatch ? returnPathEmailMatch[1] : '';
  const returnPathDomain = returnPathEmail ? returnPathEmail.split('@')[1]?.toLowerCase() : '';

  if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
    warnings.push({
      id: 'domain_discrepancy',
      title: 'Sender Domain Discrepancy',
      desc: `The email claims to be from '${fromDomain}', but the return envelope path points to '${returnPathDomain}'. This indicates potential sender spoofing.`,
      severity: 'high',
      value: 35
    });
    riskScore += 35;
  }

  // 2. SPF Check
  let spfStatus = 'NONE';
  if (/spf=pass/i.test(authResults) || /pass/i.test(receivedSpf)) {
    spfStatus = 'PASS';
    safeIndicators.push('SPF Authentication passed (authorized sending server).');
  } else if (/spf=fail/i.test(authResults) || /fail/i.test(receivedSpf)) {
    spfStatus = 'FAIL';
    warnings.push({
      id: 'spf_fail',
      title: 'SPF Verification Failed',
      desc: 'The sending mail server is not authorized by the domain owner to send emails. High chance of spoofing.',
      severity: 'high',
      value: 40
    });
    riskScore += 40;
  } else if (/spf=softfail/i.test(authResults)) {
    spfStatus = 'SOFTFAIL';
    warnings.push({
      id: 'spf_softfail',
      title: 'SPF Verification Soft-Failed',
      desc: 'The sending server is not fully authorized, but the domain owner policy is lenient.',
      severity: 'medium',
      value: 15
    });
    riskScore += 15;
  }

  // 3. DKIM Check
  let dkimStatus = 'NONE';
  if (/dkim=pass/i.test(authResults)) {
    dkimStatus = 'PASS';
    safeIndicators.push('DKIM Signature is valid (email contents unaltered).');
  } else if (/dkim=fail/i.test(authResults)) {
    dkimStatus = 'FAIL';
    warnings.push({
      id: 'dkim_fail',
      title: 'DKIM Signature Invalid',
      desc: 'DKIM cryptographical signature failed verification. The email content might have been modified in transit.',
      severity: 'high',
      value: 30
    });
    riskScore += 30;
  }

  // 4. DMARC Check
  let dmarcStatus = 'NONE';
  if (/dmarc=pass/i.test(authResults)) {
    dmarcStatus = 'PASS';
    safeIndicators.push('DMARC policy alignment check passed.');
  } else if (/dmarc=fail/i.test(authResults)) {
    dmarcStatus = 'FAIL';
    warnings.push({
      id: 'dmarc_fail',
      title: 'DMARC Alignment Failed',
      desc: 'The email failed DMARC compliance, which checks if SPF/DKIM align with the "From" header.',
      severity: 'high',
      value: 35
    });
    riskScore += 35;
  }

  // 5. Subject Urgency / Phishing Keywords Check
  const urgentKeywords = ['suspend', 'block', 'action required', 'urgent', 'verify', 'update', 'billing', 'security alert', 'unauthorized', 'reset password', 'account closed', 'invoice'];
  const matchedSpamKeywords = [];
  urgentKeywords.forEach(kw => {
    if (subject.toLowerCase().includes(kw)) {
      matchedSpamKeywords.push(kw);
    }
  });

  if (matchedSpamKeywords.length > 0) {
    warnings.push({
      id: 'subject_urgency',
      title: 'Urgent/Suspicious Subject Line',
      desc: `Contains urgency or security-alert keywords (${matchedSpamKeywords.join(', ')}), a common trigger for social engineering.`,
      severity: 'medium',
      value: 15
    });
    riskScore += 15;
  }

  // 6. Generic headers check
  if (!fromHeader) {
    warnings.push({
      id: 'no_from',
      title: 'Missing "From" Header',
      desc: 'No sender address could be found in the headers.',
      severity: 'medium',
      value: 20
    });
    riskScore += 20;
  }

  // Calculate safety score (100 - riskScore)
  const finalScore = Math.max(0, Math.min(100, 100 - riskScore));
  let rating = 'SAFE';
  if (finalScore < 40) {
    rating = 'DANGEROUS';
  } else if (finalScore < 75) {
    rating = 'SUSPICIOUS';
  }

  if (warnings.length === 0) {
    safeIndicators.push('All sender details and cryptographic signatures are consistent.');
  }

  return {
    isValid: true,
    from: fromHeader || 'Unknown Sender',
    subject: subject || '(No Subject)',
    date: headers['date'] || 'Unknown Date',
    fromDomain,
    returnPathDomain,
    spfStatus,
    dkimStatus,
    dmarcStatus,
    score: finalScore,
    rating,
    warnings,
    safeIndicators
  };
}
