import os
import sys
import json
import re
import urllib.parse
import urllib.request

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

def fetch_feed(url, label_desc):
    print(f"Downloading {label_desc} from {url}...")
    urls = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as response:
            for line in response:
                line_str = line.decode('utf-8', errors='ignore').strip()
                if line_str and not line_str.startswith('#') and not line_str.startswith('//'):
                    urls.append(line_str)
        print(f"Successfully fetched {len(urls)} URLs from {label_desc}")
    except Exception as e:
        print(f"Warning: Failed to fetch {label_desc}: {e}")
    return urls

def update_kotlin_file(model_json, kotlin_path):
    if not os.path.exists(kotlin_path):
        print(f"Kotlin engine file not found at: {kotlin_path}")
        return False
        
    with open(kotlin_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the start comment
    start_marker = "// ML normalization parameters (from phishing_model_weights.json)"
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Kotlin patch error: Marker comment not found!")
        return False

    # Find where the bias statement ends
    bias_idx = content.find("val bias =", start_idx)
    if bias_idx == -1:
        print("Kotlin patch error: bias statement not found!")
        return False

    # Find the end of the line containing the bias statement
    line_end_idx = content.find("\n", bias_idx)
    if line_end_idx == -1:
        line_end_idx = len(content)

    # Format the Kotlin code to replace the old block
    means_str = "val means = mapOf(\n" + ",\n".join([f'            "{feat}" to {model_json["means"][feat]}' for feat in model_json["features"]]) + "\n        )"
    stds_str = "val stds = mapOf(\n" + ",\n".join([f'            "{feat}" to {model_json["stds"][feat]}' for feat in model_json["features"]]) + "\n        )"
    weights_str = "val weights = mapOf(\n" + ",\n".join([f'            "{feat}" to {model_json["weights"][idx]}' for idx, feat in enumerate(model_json["features"])]) + "\n        )"
    bias_str = f"val bias = {model_json['bias']}"

    replacement_block = f"""{start_marker}
        {means_str}

        {stds_str}

        {weights_str}
        {bias_str}"""

    patched_content = content[:start_idx] + replacement_block + content[line_end_idx:]

    with open(kotlin_path, 'w', encoding='utf-8') as f:
        f.write(patched_content)
    print(f"Kotlin engine weights patched successfully at {kotlin_path}!")
    return True

def main():
    try:
        import pandas as pd
        import numpy as np
        from sklearn.model_selection import train_test_split
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import classification_report, accuracy_score
    except ImportError:
        print("Required libraries (pandas, numpy, scikit-learn) not found. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "numpy", "scikit-learn"])
        import pandas as pd
        import numpy as np
        from sklearn.model_selection import train_test_split
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import classification_report, accuracy_score

    # Paths to local cached datasets
    phiusiil_path = os.path.expanduser("~/.cache/kagglehub/datasets/ndarvind/phiusiil-phishing-url-dataset/versions/1/PhiUSIIL_Phishing_URL_Dataset.csv")
    malicious_phish_path = os.path.expanduser("~/.cache/kagglehub/datasets/sid321axn/malicious-urls-dataset/versions/1/malicious_phish.csv")

    phishing_urls = []
    legitimate_urls = []

    # 1. Load PhiUSIIL (Current local dataset)
    if os.path.exists(phiusiil_path):
        print(f"Loading current local dataset: {phiusiil_path}...")
        df_phi = pd.read_csv(phiusiil_path, usecols=['URL', 'label'])
        # label=1 is benign, label=0 is phishing
        legitimate_urls.extend(df_phi[df_phi['label'] == 1]['URL'].dropna().tolist())
        phishing_urls.extend(df_phi[df_phi['label'] == 0]['URL'].dropna().tolist())
        print(f"Loaded {len(df_phi)} entries from PhiUSIIL")
    else:
        print(f"Warning: PhiUSIIL dataset not found at {phiusiil_path}")

    # 2. Load Kaggle dataset (Static selection 3)
    if os.path.exists(malicious_phish_path):
        print(f"Loading Kaggle dataset: {malicious_phish_path}...")
        df_mal = pd.read_csv(malicious_phish_path)
        # categories: benign, phishing, defacement, malware
        legitimate_urls.extend(df_mal[df_mal['type'] == 'benign']['url'].dropna().tolist())
        phishing_urls.extend(df_mal[df_mal['type'] == 'phishing']['url'].dropna().tolist())
        print(f"Loaded {len(df_mal)} entries from malicious_phish")
    else:
        print(f"Warning: Kaggle malicious_phish dataset not found at {malicious_phish_path}")

    # 3. Fetch Phishing.Database active links (Dynamic selection 1)
    db_urls = fetch_feed('https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-links-ACTIVE.txt', 'Phishing.Database Active links')
    phishing_urls.extend(db_urls)

    # 4. Fetch OpenPhish feed (Dynamic selection 2)
    openphish_urls = fetch_feed('https://openphish.com/feed.txt', 'OpenPhish Active feed')
    phishing_urls.extend(openphish_urls)

    # Clean and Deduplicate
    print("Deduplicating and formatting URLs...")
    phishing_set = set(str(u).strip() for u in phishing_urls if str(u).strip())
    legitimate_set = set(str(u).strip() for u in legitimate_urls if str(u).strip())
    
    # Ensure no overlap
    phishing_set = phishing_set - legitimate_set

    print(f"Total Unique Legitimate URLs: {len(legitimate_set)}")
    print(f"Total Unique Phishing URLs: {len(phishing_set)}")

    # To avoid huge processing times and extreme class imbalance,
    # let's limit or sample the data if it exceeds a threshold, keeping it balanced.
    max_samples = 250000
    legit_list = list(legitimate_set)
    phish_list = list(phishing_set)
    
    # Balanced sampling
    num_samples = min(len(legit_list), len(phish_list), max_samples // 2)
    
    # Seed for reproducibility
    import random
    random.seed(42)
    sampled_legit = random.sample(legit_list, num_samples)
    sampled_phish = random.sample(phish_list, num_samples)
    
    print(f"Sampled balanced dataset: {num_samples} legitimate and {num_samples} phishing URLs (Total: {num_samples * 2})")
    
    merged_urls = sampled_legit + sampled_phish
    merged_targets = np.concatenate([np.zeros(num_samples), np.ones(num_samples)])

    print("Extracting lexical features from merged URLs...")
    feature_list = []
    for idx, url in enumerate(merged_urls):
        feature_list.append(extract_features(url))
        if idx > 0 and idx % 50000 == 0:
            print(f"Processed {idx} URLs...")

    X = np.array(feature_list)
    y = merged_targets

    # Split for validation
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Compute means and stds for feature scaling
    means = np.mean(X_train, axis=0)
    stds = np.std(X_train, axis=0)
    stds[stds == 0] = 1.0  # Avoid division by zero

    # Scale features
    X_train_scaled = (X_train - means) / stds
    X_test_scaled = (X_test - means) / stds

    # Train Logistic Regression
    print("Training Logistic Regression Model...")
    model = LogisticRegression(max_iter=1000, solver='lbfgs')
    model.fit(X_train_scaled, y_train)

    # Validate
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))

    # Save to JSON
    feature_names = [
        "url_length", "domain_length", "is_ip", "tld_length", "subdomain_count", "is_https",
        "letters", "letter_ratio", "digits", "digit_ratio", "special", "special_ratio",
        "equals_count", "qmark_count", "amp_count", "hyphen_count", "dots_count", "slash_count"
    ]

    model_json = {
        "features": feature_names,
        "weights": [round(float(w), 6) for w in model.coef_[0]],
        "bias": round(float(model.intercept_[0]), 6),
        "means": {feat: round(float(m), 6) for feat, m in zip(feature_names, means)},
        "stds": {feat: round(float(s), 6) for feat, s in zip(feature_names, stds)}
    }

    # Save output to JS directory
    js_output_path = "./src/lib/phishing_model_weights.json"
    with open(js_output_path, 'w', encoding='utf-8') as out_f:
        json.dump(model_json, out_f, indent=2)
    print(f"JavaScript model weights updated at: {js_output_path}")

    # Patch Android Kotlin file
    kotlin_path = "./android-app/app/src/main/java/com/phishguard/PhishingEngine.kt"
    update_kotlin_file(model_json, kotlin_path)

if __name__ == "__main__":
    main()
