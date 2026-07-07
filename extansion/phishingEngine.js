// Phishing Detection Engine (ML + Heuristics)
// Runs fully offline with zero external requests.

const modelWeights = {
  "features": [
    "url_length",
    "domain_length",
    "is_ip",
    "tld_length",
    "subdomain_count",
    "is_https",
    "letters",
    "letter_ratio",
    "digits",
    "digit_ratio",
    "special",
    "special_ratio",
    "equals_count",
    "qmark_count",
    "amp_count",
    "hyphen_count",
    "dots_count",
    "slash_count",
    "shannon_entropy",
    "sensitive_words_count",
    "is_shortened",
    "is_suspicious_tld",
    "is_typosquatting",
    "brand_abuse_triggered"
  ],
  "weights": [
    0.197894,
    1.470395,
    0.287978,
    0.006417,
    -0.762411,
    0.791169,
    0.444857,
    -0.215907,
    0.025833,
    0.102017,
    -0.922685,
    0.247363,
    0.332909,
    -0.216133,
    -0.096964,
    -0.552863,
    0.257791,
    1.491433,
    -0.323807,
    0.129927,
    0.036899,
    0.627049,
    0.008297,
    0.127117
  ],
  "bias": 0.164736,
  "means": {
    "url_length": 62.9131,
    "domain_length": 20.59727,
    "is_ip": 0.005215,
    "tld_length": 2.821825,
    "subdomain_count": 0.75099,
    "is_https": 0.45755,
    "letters": 46.433865,
    "letter_ratio": 0.768918,
    "digits": 7.675435,
    "digit_ratio": 0.073599,
    "special": 8.8038,
    "special_ratio": 0.157483,
    "equals_count": 0.32629,
    "qmark_count": 0.156645,
    "amp_count": 0.14923,
    "hyphen_count": 1.28197,
    "dots_count": 2.273705,
    "slash_count": 3.209805,
    "shannon_entropy": 2.702479,
    "sensitive_words_count": 0.22294,
    "is_shortened": 0.00077,
    "is_suspicious_tld": 0.05509,
    "is_typosquatting": 0.00252,
    "brand_abuse_triggered": 0.034175
  },
  "stds": {
    "url_length": 82.389127,
    "domain_length": 11.884164,
    "is_ip": 0.072026,
    "tld_length": 0.620176,
    "subdomain_count": 0.991607,
    "is_https": 0.498195,
    "letters": 57.136987,
    "letter_ratio": 0.102872,
    "digits": 22.630328,
    "digit_ratio": 0.104009,
    "special": 10.510766,
    "special_ratio": 0.046895,
    "equals_count": 1.289575,
    "qmark_count": 0.416818,
    "amp_count": 0.846038,
    "hyphen_count": 2.661164,
    "dots_count": 3.492884,
    "slash_count": 2.997498,
    "shannon_entropy": 0.626925,
    "sensitive_words_count": 1.994356,
    "is_shortened": 0.027738,
    "is_suspicious_tld": 0.228156,
    "is_typosquatting": 0.050136,
    "brand_abuse_triggered": 0.181678
  }
};

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

export function extractModelFeatures(urlString) {
  const url = urlString.trim();
  const is_https = /^https:\/\//i.test(url) ? 1 : 0;
  
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
  
  const url_length = url.length;
  const domain_length = host.length;
  const is_ip = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ? 1 : 0;
  
  let tld_length = 0;
  let subdomain_count = 0;
  if (host && !is_ip) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      tld_length = parts[parts.length - 1].length;
      subdomain_count = Math.max(0, parts.length - 2);
    }
  }
  
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
  
  const equals_count = (url.match(/=/g) || []).length;
  const qmark_count = (url.match(/\?/g) || []).length;
  const amp_count = (url.match(/&/g) || []).length;
  const hyphen_count = (url.match(/-/g) || []).length;
  const dots_count = (url.match(/\./g) || []).length;
  const slash_count = (url.match(/\//g) || []).length;
  
  const letter_ratio = url_length > 0 ? letters / url_length : 0;
  const digit_ratio = url_length > 0 ? digits / url_length : 0;
  const special_ratio = url_length > 0 ? special / url_length : 0;

  const nb_dots = dots_count;
  const isHttps = is_https;

  // 1. Shannon Entropy
  let shannon_entropy = 0;
  if (host && !is_ip) {
    const primaryName = extractPrimaryDomainName(host);
    shannon_entropy = calculateShannonEntropy(primaryName);
  }

  // 2. Sensitive Words Count
  let sensitive_words_count = 0;
  const sensitiveWords = [
    'confirm', 'account', 'banking', 'secure', 'login', 'signin', 
    'verify', 'webscr', 'ebayisapi', 'update', 'password', 'credential',
    'wallet', 'auth', 'recover', 'claim', 'free', 'gift', 'award'
  ];
  const lowerUrl = url.toLowerCase();
  sensitiveWords.forEach(word => {
    let pos = lowerUrl.indexOf(word);
    while (pos !== -1) {
      sensitive_words_count++;
      pos = lowerUrl.indexOf(word, pos + 1);
    }
  });

  // 3. Is Shortened
  const is_shortened = SHORTENERS.some(shortener => host === shortener || host.endsWith('.' + shortener)) ? 1 : 0;

  // 4. Is Suspicious TLD
  let is_suspicious_tld = 0;
  const SUSPICIOUS_TLDS = [
    'zip', 'mov', 'fit', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 
    'click', 'download', 'racing', 'stream', 'win', 'bid', 'vip', 'xyz',
    'ru', 'cn', 'su', 'buzz', 'date', 'icu', 'loan', 'men', 'xin'
  ];
  if (host && !is_ip) {
    const parts = host.split('.');
    const tld = parts[parts.length - 1];
    if (tld && SUSPICIOUS_TLDS.includes(tld)) {
      is_suspicious_tld = 1;
    }
  }

  // 5 & 6. Typosquatting / Brand Abuse
  let is_typosquatting = 0;
  let brand_abuse_triggered = 0;
  if (host && !is_ip) {
    const primaryName = extractPrimaryDomainName(host);
    const hostParts = host.replace(/^www\./, '').split('.');

    TOP_BRANDS.forEach(brand => {
      const brandRaw = brand.split('.')[0];
      const isOfficial = host === brand || host.endsWith('.' + brand);
      
      if (!isOfficial) {
        const hasBrandMatch = hostParts.some(part => part === brandRaw || part.includes(brandRaw));
        if (hasBrandMatch) {
          brand_abuse_triggered = 1;
        }
      }
    });

    if (!brand_abuse_triggered) {
      TOP_BRANDS.forEach(brand => {
        const brandRaw = brand.split('.')[0];
        if (primaryName !== brandRaw) {
          const dist = getLevenshteinDistance(primaryName, brandRaw);
          if (dist > 0 && dist <= 2) {
            is_typosquatting = 1;
          }
        }
      });
    }
  }
  
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
    shannon_entropy,
    sensitive_words_count,
    is_shortened,
    is_suspicious_tld,
    is_typosquatting,
    brand_abuse_triggered
  };
}

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

function detectIDNHomograph(hostname) {
  if (!hostname) return null;
  const lowerHost = hostname.toLowerCase();
  const isPunycode = lowerHost.split('.').some(part => part.startsWith('xn--'));
  
  const hasCyrillic = /[\u0400-\u04FF]/.test(lowerHost);
  const hasGreek = /[\u0370-\u03FF]/.test(lowerHost);
  const hasLatin = /[a-z0-9]/.test(lowerHost);

  const cyrillicToLatinMap = {
    'а': 'a', 'с': 'c', 'е': 'e', 'ѕ': 's', 'і': 'i', 
    'ј': 'j', 'о': 'o', 'р': 'p', 'у': 'y', 'х': 'x', 
    'є': 'e', 'ї': 'i'
  };

  let decodedHost = lowerHost;
  
  if (isPunycode || (hasCyrillic && hasLatin) || (hasGreek && hasLatin)) {
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
        ? 'The domain is registered in Punycode. This is often used to hide characters from other alphabets that look exactly like English letters.'
        : 'The domain mixes English characters with identical-looking Cyrillic or Greek characters. Real brands never mix character sets.'
    };
  }
  return null;
}

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

export function analyzeURL(urlString, localBlacklist = null) {
  const url = urlString.trim();
  
  if (!url) {
    return {
      isValid: false,
      score: 100,
      rating: 'SAFE',
      details: ['Please enter a URL to check.']
    };
  }

  let parsedUrl = null;
  let hostname = '';
  let path = '';
  let protocol = '';
  let isIpAddress = false;
  
  try {
    let urlToParse = url;
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }
    parsedUrl = new URL(urlToParse);
    hostname = parsedUrl.hostname.toLowerCase();
    path = parsedUrl.pathname;
    protocol = parsedUrl.protocol;
  } catch (e) {
    hostname = url.split('/')[0].toLowerCase();
    path = url.substring(hostname.length);
  }

  const hasHttps = /^https:/i.test(protocol || url);

  // 1. Active Threat Intelligence Database Lookup (Instant Danger)
  if (localBlacklist) {
    const isBlacklisted = (localBlacklist instanceof Set)
      ? localBlacklist.has(hostname)
      : localBlacklist.includes(hostname);

    if (isBlacklisted) {
      return {
        isValid: true,
        url,
        domain: hostname,
        score: 0,
        riskScore: 100,
        rating: 'DANGEROUS',
        mlProbability: 1.00,
        warnings: [{
          id: 'threat_blacklist',
          title: 'Threat Intel Match',
          desc: 'This domain is listed on active threat intelligence database blacklists. Extremely high risk.',
          severity: 'high',
          value: 100
        }],
        safeIndicators: [],
        features: extractModelFeatures(url),
        breakdown: {
          protocol: { text: protocol ? protocol.replace(':', '') : (hasHttps ? 'https' : 'http'), isSafe: hasHttps },
          hostname: hostname,
          subdomains: hostname.replace(/^www\./, '').split('.').slice(0, -2).filter(Boolean),
          primaryDomainName: extractPrimaryDomainName(hostname),
          path: path,
          isIpAddress: false,
          isShortened: false,
          typosquatTarget: null,
          brandAbuseTriggered: false,
          blacklisted: true
        }
      };
    }
  }

  // 2. Whitelist Check (Instantly Safe)
  const isWhitelisted = TOP_BRANDS.some(brand => {
    return hostname === brand || hostname.endsWith('.' + brand);
  });

  if (isWhitelisted && hasHttps) {
    return {
      isValid: true,
      url,
      domain: hostname,
      score: 100,
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

  // 3. Extract features & Calculate ML prediction
  const features = extractModelFeatures(url);
  
  let z = modelWeights.bias;
  modelWeights.features.forEach((feat, idx) => {
    const mean = modelWeights.means[feat] || 0;
    const std = modelWeights.stds[feat] || 1;
    const norm_val = (features[feat] - mean) / std;
    z += norm_val * modelWeights.weights[idx];
  });
  
  const mlProbability = 1 / (1 + Math.exp(-z));
  
  // 4. Heuristics Analysis
  const warnings = [];
  const safeIndicators = [];
  let riskScore = 0;

  // HTTP warning
  if (!hasHttps) {
    warnings.push({
      id: 'no_https',
      title: 'Insecure Connection (HTTP)',
      desc: 'The website does not use SSL/HTTPS encryption. Phishing sites often use HTTP to avoid verification.',
      severity: 'medium',
      value: 20
    });
    riskScore += 20;
  } else {
    safeIndicators.push('SSL/HTTPS connection is active (encrypted).');
  }

  // IP Address Domain
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipPattern.test(hostname)) {
    isIpAddress = true;
    warnings.push({
      id: 'ip_address',
      title: 'IP Address Used as Domain',
      desc: 'The URL uses a numerical IP address instead of a standard domain name. This is a common indicator of a phishing server.',
      severity: 'high',
      value: 35
    });
    riskScore += 35;
  }

  // Shortening Service
  const isShortened = SHORTENERS.some(shortener => hostname === shortener || hostname.endsWith('.' + shortener));
  if (isShortened) {
    warnings.push({
      id: 'shortener',
      title: 'URL Shortening Service Detected',
      desc: 'Uses a link shortener service. Attackers often use these to hide the malicious destination URL.',
      severity: 'medium',
      value: 20
    });
    riskScore += 20;
  }

  // Typosquatting / Homograph / Brand Abuse (Enhanced to parse subdomains separately)
  let typosquatTarget = null;
  let minDistance = 999;
  let brandAbuseTriggered = false;
  
  if (!isIpAddress && hostname) {
    const primaryName = extractPrimaryDomainName(hostname);
    const hostParts = hostname.replace(/^www\./, '').split('.');

    TOP_BRANDS.forEach(brand => {
      const brandRaw = brand.split('.')[0];
      const isOfficial = hostname === brand || hostname.endsWith('.' + brand);
      
      if (!isOfficial) {
        // Look for brand name embedded anywhere inside hostname parts
        const hasBrandMatch = hostParts.some(part => part === brandRaw || part.includes(brandRaw));
        if (hasBrandMatch) {
          brandAbuseTriggered = true;
          typosquatTarget = brand;
        }
      }
    });

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
        ? `The domain contains the brand name '${typosquatTarget.split('.')[0]}' but is not the official brand website.` 
        : `The domain name closely mimics a highly visited website (${typosquatTarget}). This is a major typosquatting sign.`;
      
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

  // Sensitive Keywords in host or path
  const sensitiveKeywords = ['login', 'signin', 'secure', 'verify', 'update', 'banking', 'account', 'wallet', 'auth', 'recovery', 'free', 'gift', 'prize', 'credential'];
  const matchedKeywords = [];
  
  sensitiveKeywords.forEach(kw => {
    if (hostname.includes(kw) || path.toLowerCase().includes(kw)) {
      matchedKeywords.push(kw);
    }
  });

  if (matchedKeywords.length > 0) {
    warnings.push({
      id: 'keywords',
      title: 'Suspicious Keywords Detected',
      desc: `Contains security or urgency keywords (${matchedKeywords.join(', ')}) designed to capture credentials.`,
      severity: 'medium',
      value: 15 * Math.min(matchedKeywords.length, 3)
    });
    riskScore += 15 * Math.min(matchedKeywords.length, 3);
  }

  // Shannon Entropy Check (random characters)
  if (!isIpAddress && hostname) {
    const primaryName = extractPrimaryDomainName(hostname);
    const entropy = calculateShannonEntropy(primaryName);
    
    if (primaryName.length > 8 && entropy > 4.1) {
      warnings.push({
        id: 'high_entropy',
        title: 'High Randomness in Domain Name',
        desc: `The domain name contains highly random characters (Entropy: ${entropy.toFixed(2)}), suggesting script generation.`,
        severity: 'medium',
        value: 15
      });
      riskScore += 15;
    }
  }

  // Too many subdomains
  const dotCount = (hostname.match(/\./g) || []).length;
  if (dotCount > 3) {
    warnings.push({
      id: 'many_subdomains',
      title: 'Excessive Subdomains',
      desc: 'The URL has an unusually high number of subdomains, which can be used to hide the primary host.',
      severity: 'medium',
      value: 15
    });
    riskScore += 15;
  }

  // @ symbol in URL
  if (url.includes('@')) {
    warnings.push({
      id: 'at_symbol',
      title: 'Contains "@" Symbol',
      desc: 'The "@" symbol in a URL causes browsers to ignore everything preceding it, a common spoofing tactic.',
      severity: 'high',
      value: 30
    });
    riskScore += 30;
  }

  // IDN Homograph Attack
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

  // Suspicious TLDs
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
        desc: `The Top-Level Domain '.${tld}' is frequently associated with malicious operations.`,
        severity: 'medium',
        value: 20
      });
      riskScore += 20;
    }
  }

  const mlScore = Math.round(mlProbability * 100);
  
  // Smart Hybrid Score Calibration (Ensemble)
  let finalScore = Math.round((mlScore * 0.6) + (riskScore * 0.4));

  const hasHighSeverityWarning = warnings.some(w => 
    w.id === 'typosquatting' || 
    w.id === 'homograph_attack' || 
    w.id === 'at_symbol' || 
    w.id === 'ip_address'
  );

  if (hasHighSeverityWarning) {
    finalScore = Math.max(finalScore, 75);
  } else if (mlScore > 90) {
    finalScore = Math.max(finalScore, 60);
  } else if (warnings.length === 0) {
    finalScore = Math.min(finalScore, 25);
  }

  finalScore = Math.min(Math.max(finalScore, 0), 100);

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
    score: 100 - finalScore,
    riskScore: finalScore,
    rating,
    mlProbability: parseFloat(mlProbability.toFixed(4)),
    warnings,
    safeIndicators,
    features,
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
