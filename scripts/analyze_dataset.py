import os
import sys
import json
import re
import urllib.parse

TOP_BRANDS = [
    'google.com', 'facebook.com', 'apple.com', 'microsoft.com', 
    'amazon.com', 'netflix.com', 'paypal.com', 'instagram.com', 
    'twitter.com', 'yahoo.com', 'linkedin.com', 'zoom.us', 
    'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
    'github.com', 'gmail.com', 'outlook.com', 'coinbase.com', 
    'binance.com', 'metamask.io'
]

SHORTENERS = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 
    'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'rebrand.ly'
]

SUSPICIOUS_TLDS = [
    'zip', 'mov', 'fit', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 
    'click', 'download', 'racing', 'stream', 'win', 'bid', 'vip', 'xyz',
    'ru', 'cn', 'su', 'buzz', 'date', 'icu', 'loan', 'men', 'xin'
]

SENSITIVE_WORDS = [
    'confirm', 'account', 'banking', 'secure', 'login', 'signin', 
    'verify', 'webscr', 'ebayisapi', 'update', 'password', 'credential',
    'wallet', 'auth', 'recover', 'claim', 'free', 'gift', 'award'
]

def calculate_shannon_entropy(s):
    if not s:
        return 0.0
    import math
    probs = [float(s.count(c)) / len(s) for c in set(s)]
    entropy = - sum(p * math.log(p, 2) for p in probs)
    return entropy

levenshtein_cache = {}
def get_levenshtein_distance(a, b):
    key = f"{a}:{b}"
    if key in levenshtein_cache:
        return levenshtein_cache[key]
    rev_key = f"{b}:{a}"
    if rev_key in levenshtein_cache:
        return levenshtein_cache[rev_key]
        
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        dp[i][0] = i
    for j in range(len(b) + 1):
        dp[0][j] = j
        
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(
                    dp[i - 1][j - 1] + 1,  # substitution
                    dp[i - 1][j] + 1,      # deletion
                    dp[i][j - 1] + 1       # insertion
                )
    res = dp[len(a)][len(b)]
    levenshtein_cache[key] = res
    return res

def extract_primary_domain_name(hostname):
    if not hostname:
        return ""
    hostname = re.sub(r'^www\.', '', hostname)
    parts = hostname.split('.')
    if len(parts) < 2:
        return hostname
    last_part = parts[-1]
    second_last_part = parts[-2]
    common_registry_tlds = ['co', 'com', 'org', 'net', 'gov', 'edu', 'asn', 'id', 'ac']
    is_multi_part_suffix = len(last_part) == 2 and second_last_part in common_registry_tlds
    if is_multi_part_suffix and len(parts) >= 3:
        return parts[-3]
    else:
        return parts[-2]

def extract_features(url):
    url = str(url).strip()
    
    # 1. Is HTTPS
    is_https = 1 if url.lower().startswith('https://') else 0
    
    # Parse URL
    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc.lower()
        path = parsed.path
        if not host:
            # Fallback if no protocol
            temp_url = 'https://' + url if not re.match(r'^https?://', url, re.IGNORECASE) else url
            parsed = urllib.parse.urlparse(temp_url)
            host = parsed.netloc.lower()
            path = parsed.path
    except Exception:
        host = ''
        path = ''
        
    if ':' in host:
        host = host.split(':')[0]
        
    # 2. URL Length
    url_len = len(url)
    
    # 3. Domain Length
    domain_len = len(host)
    
    # 4. Is IP Address
    is_ip = 1 if re.match(r'^(?:\d{1,3}\.){3}\d{1,3}$', host) else 0
    
    # 5. TLD Length and Subdomain Count
    tld_len = 0
    subdomain_count = 0
    if host and not is_ip:
        parts = host.split('.')
        if len(parts) >= 2:
            tld_len = len(parts[-1])
            subdomain_count = max(0, len(parts) - 2)
            
    # Count character types
    letters = sum(c.isalpha() for c in url)
    digits = sum(c.isdigit() for c in url)
    special = len(url) - letters - digits
    
    # Delimiters
    equals_count = url.count('=')
    qmark_count = url.count('?')
    amp_count = url.count('&')
    hyphen_count = url.count('-')
    dots_count = url.count('.')
    slash_count = url.count('/')
    
    # Ratios
    letter_ratio = letters / url_len if url_len > 0 else 0
    digit_ratio = digits / url_len if url_len > 0 else 0
    special_ratio = special / url_len if url_len > 0 else 0

    # Heuristics 1: Shannon Entropy
    shannon_entropy = 0.0
    if host and not is_ip:
        primary_name = extract_primary_domain_name(host)
        shannon_entropy = calculate_shannon_entropy(primary_name)
        
    # Heuristics 2: Sensitive Words Count
    sensitive_words_count = 0
    lower_url = url.lower()
    for word in SENSITIVE_WORDS:
        sensitive_words_count += lower_url.count(word)
        
    # Heuristics 3: Is Shortened
    is_shortened = 0
    if host:
        is_shortened = 1 if any(host == sh or host.endswith('.' + sh) for sh in SHORTENERS) else 0
        
    # Heuristics 4: Is Suspicious TLD
    is_suspicious_tld = 0
    if host and not is_ip:
        parts = host.split('.')
        tld = parts[-1]
        is_suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0
        
    # Heuristics 5 & 6: Typosquatting / Brand Abuse
    is_typosquatting = 0
    brand_abuse_triggered = 0
    if host and not is_ip:
        primary_name = extract_primary_domain_name(host)
        host_parts = host.replace('www.', '').split('.')
        
        # Check brand abuse
        for brand in TOP_BRANDS:
            brand_raw = brand.split('.')[0]
            is_official = (host == brand or host.endswith('.' + brand))
            if not is_official:
                has_brand_match = any(part == brand_raw or brand_raw in part for part in host_parts)
                if has_brand_match:
                    brand_abuse_triggered = 1
                    
        # Check typosquatting
        if not brand_abuse_triggered:
            min_dist = 999
            for brand in TOP_BRANDS:
                brand_raw = brand.split('.')[0]
                if primary_name != brand_raw:
                    dist = get_levenshtein_distance(primary_name, brand_raw)
                    if 0 < dist <= 2:
                        is_typosquatting = 1

    return [
        url_len,
        domain_len,
        is_ip,
        tld_len,
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
    ]

def main():
    cache_path = os.path.expanduser("~/.cache/kagglehub/datasets/ndarvind/phiusiil-phishing-url-dataset/versions/1")
    csv_path = os.path.join(cache_path, "PhiUSIIL_Phishing_URL_Dataset.csv")
    
    if not os.path.exists(csv_path):
        print(f"Dataset CSV not found at: {csv_path}")
        return

    try:
        import pandas as pd
        import numpy as np
        from sklearn.model_selection import train_test_split
        from sklearn.linear_model import LogisticRegression
    except ImportError:
        print("Required libraries (pandas, numpy, scikit-learn) not found. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "numpy", "scikit-learn"])
        import pandas as pd
        import numpy as np
        from sklearn.model_selection import train_test_split
        from sklearn.linear_model import LogisticRegression

    print("Loading dataset...")
    df = pd.read_csv(csv_path, usecols=['URL', 'label'])
    
    # Invert label: in dataset 1 = legitimate, 0 = phishing
    # In our engine target: 1 = phishing (dangerous), 0 = legitimate (safe)
    df['target'] = 1 - df['label']
    
    print("Extracting features from URLs...")
    feature_list = []
    for idx, url in enumerate(df['URL']):
        feature_list.append(extract_features(url))
        if idx > 0 and idx % 50000 == 0:
            print(f"Processed {idx} URLs...")
            
    X = np.array(feature_list)
    y = df['target'].values
    
    # Split for validation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Calculate means and stds for feature scaling on the training set
    means = np.mean(X_train, axis=0)
    stds = np.std(X_train, axis=0)
    stds[stds == 0] = 1.0  # Avoid division by zero
    
    # Normalize features
    X_train_scaled = (X_train - means) / stds
    X_test_scaled = (X_test - means) / stds
    
    # Train Logistic Regression
    print("Training Logistic Regression...")
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_scaled, y_train)
    
    train_acc = model.score(X_train_scaled, y_train)
    test_acc = model.score(X_test_scaled, y_test)
    print(f"Training Accuracy: {train_acc:.4%}")
    print(f"Test Accuracy      : {test_acc:.4%}")
    
    feature_names = [
        "url_length", "domain_length", "is_ip", "tld_length", "subdomain_count", "is_https",
        "letters", "letter_ratio", "digits", "digit_ratio", "special", "special_ratio",
        "equals_count", "qmark_count", "amp_count", "hyphen_count", "dots_count", "slash_count",
        "shannon_entropy", "sensitive_words_count", "is_shortened", "is_suspicious_tld",
        "is_typosquatting", "brand_abuse_triggered"
    ]
    
    # Build weights JSON
    model_json = {
        "features": feature_names,
        "weights": [round(float(w), 6) for w in model.coef_[0]],
        "bias": round(float(model.intercept_[0]), 6),
        "means": {feat: round(float(m), 6) for feat, m in zip(feature_names, means)},
        "stds": {feat: round(float(s), 6) for feat, s in zip(feature_names, stds)}
    }
    
    output_dir = "./src/lib"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "phishing_model_weights.json")
    with open(output_path, 'w') as out_f:
        json.dump(model_json, out_f, indent=2)
        
    print(f"\nModel training completed successfully! Weights saved to {output_path}")

if __name__ == "__main__":
    main()
