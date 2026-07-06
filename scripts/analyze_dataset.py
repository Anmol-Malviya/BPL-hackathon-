import os
import sys
import csv
import math
import json

def main():
    cache_path = os.path.expanduser("~/.cache/kagglehub/datasets/sunnykusawa/phishing-urls/versions/1")
    csv_path = os.path.join(cache_path, "phishing_url_dataset.csv")
    
    if not os.path.exists(csv_path):
        print(f"Dataset CSV not found at: {csv_path}")
        return

    data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            numeric_row = {}
            for k, v in row.items():
                try:
                    numeric_row[k] = float(v)
                except ValueError:
                    numeric_row[k] = v
            data.append(numeric_row)

    if len(data) == 0:
        return

    headers = list(data[0].keys())
    features = [h for h in headers if h != 'target']
    n_features = len(features)

    # 1. Compute Means and Stds for Feature Scaling
    means = {}
    stds = {}
    
    for feat in features:
        vals = [row[feat] for row in data]
        mean = sum(vals) / len(vals)
        variance = sum((x - mean) ** 2 for x in vals) / len(vals)
        std = math.sqrt(variance) if variance > 0 else 1.0
        
        means[feat] = mean
        stds[feat] = std

    # 2. Normalize data
    X = []
    y = []
    for row in data:
        x_vec = []
        for feat in features:
            # Standard score: (x - mean) / std
            norm_val = (row[feat] - means[feat]) / stds[feat]
            x_vec.append(norm_val)
        X.append(x_vec)
        y.append(row['target'])

    # 3. Train Logistic Regression using Gradient Descent
    weights = [0.0] * n_features
    bias = 0.0
    learning_rate = 0.1
    epochs = 1500

    def sigmoid(z):
        z = max(-50.0, min(50.0, z))
        return 1.0 / (1.0 + math.exp(-z))

    for epoch in range(epochs):
        dw = [0.0] * n_features
        db = 0.0
        for i in range(len(X)):
            z = sum(X[i][j] * weights[j] for j in range(n_features)) + bias
            a = sigmoid(z)
            error = a - y[i]
            for j in range(n_features):
                dw[j] += error * X[i][j]
            db += error
        
        # Update weights and bias
        for j in range(n_features):
            weights[j] -= learning_rate * (dw[j] / len(X))
        bias -= learning_rate * (db / len(X))

    print(f"Normalized Logistic Regression model trained!")
    print("Model Weights:")
    model_json = {
        "features": features,
        "weights": [round(w, 4) for w in weights],
        "bias": round(bias, 4),
        "means": {k: round(v, 4) for k, v in means.items()},
        "stds": {k: round(v, 4) for k, v in stds.items()}
    }
    
    for feat, w in zip(features, weights):
        print(f"  {feat:<25}: {w:.4f} (mean={means[feat]:.2f}, std={stds[feat]:.2f})")
    print(f"  bias                     : {bias:.4f}")

    output_dir = "./src/lib"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "phishing_model_weights.json")
    with open(output_path, 'w') as out_f:
        json.dump(model_json, out_f, indent=2)
    print(f"\nNormalized model weights saved to {output_path}")

if __name__ == "__main__":
    main()
