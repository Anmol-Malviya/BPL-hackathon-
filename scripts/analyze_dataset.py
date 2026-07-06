import os
import sys
import json
import re
import urllib.parse

def extract_features(url):
    url = str(url).strip()
    
    # 1. Is HTTPS
    is_https = 1 if url.lower().startswith('https://') else 0
    
    # Parse URL
    try:
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc.lower()
        if not host:
            # Fallback if no protocol
            temp_url = 'https://' + url if not re.match(r'^https?://', url, re.IGNORECASE) else url
            parsed = urllib.parse.urlparse(temp_url)
            host = parsed.netloc.lower()
    except Exception:
        host = ''
        
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
        slash_count
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
        "equals_count", "qmark_count", "amp_count", "hyphen_count", "dots_count", "slash_count"
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
