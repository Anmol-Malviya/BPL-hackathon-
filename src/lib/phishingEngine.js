import modelWeights from './phishing_model_weights.json';

// Levenshtein distance to check typosquatting
function getLevenshteinDistance(a, b) {
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

  return matrix[b.length][a.length];
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
  let url = urlString.trim();
  
  // Clean URL format for parsing
  let parsedUrl = null;
  let isValid = 0;
  let hostname = '';
  let path = '';
  
  try {
    let urlToParse = url;
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'http://' + urlToParse;
    }
    parsedUrl = new URL(urlToParse);
    isValid = 1;
    hostname = parsedUrl.hostname;
    path = parsedUrl.pathname;
  } catch (e) {
    isValid = 0;
    hostname = url.split('/')[0] || '';
    path = url.substring(hostname.length) || '';
  }

  // Feature 1: url_length
  const url_length = url.length;

  // Feature 2: valid_url
  const valid_url = isValid;

  // Feature 3: at_symbol
  const at_symbol = url.includes('@') ? 1 : 0;

  // Feature 4: sensitive_words_count
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

  // Feature 5: path_length
  const path_length = path.length;

  // Feature 6: isHttps
  const isHttps = /^https:\/\//i.test(url) ? 1 : 0;

  // Feature 7: nb_dots
  const nb_dots = (url.match(/\./g) || []).length;

  // Feature 8: nb_hyphens
  const nb_hyphens = (url.match(/-/g) || []).length;

  // Feature 9: nb_and
  const nb_and = (url.match(/&/g) || []).length;

  // Feature 10: nb_or
  const nb_or = (url.match(/\|/g) || []).length;

  // Feature 11: nb_www
  const nb_www = (lowerUrl.match(/www/g) || []).length;

  // Feature 12: nb_com
  const nb_com = (lowerUrl.match(/com/g) || []).length;

  // Feature 13: nb_underscore
  const nb_underscore = (url.match(/_/g) || []).length;

  return {
    url_length,
    valid_url,
    at_symbol,
    sensitive_words_count,
    path_length,
    isHttps,
    nb_dots,
    nb_hyphens,
    nb_and,
    nb_or,
    nb_www,
    nb_com,
    nb_underscore
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
      features: extractModelFeatures(url)
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
    const domainParts = hostname.replace('www.', '').split('.');
    // get primary domain name (e.g., 'paypal' from 'paypal.com' or 'secure-paypal' from 'secure-paypal.com')
    const primaryName = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : hostname;

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
    const domainParts = hostname.replace('www.', '').split('.');
    const primaryName = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domainParts[0];
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
    features // Expose raw extracted features for details UI
  };
}
