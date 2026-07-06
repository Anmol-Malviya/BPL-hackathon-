import os
import sys

def main():
    try:
        import kagglehub
    except ImportError:
        print("kagglehub not installed, installing now...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
        import kagglehub

    print("Downloading dataset sunnykusawa/phishing-urls...")
    path = kagglehub.dataset_download("sunnykusawa/phishing-urls")
    print(f"Dataset downloaded to: {path}")

    # List files in the downloaded path
    files = os.listdir(path)
    print(f"Files in dataset: {files}")

    # If there is a CSV, print first few lines
    for f in files:
        if f.endswith('.csv'):
            csv_path = os.path.join(path, f)
            print(f"\nFound CSV: {f} (size: {os.path.getsize(csv_path)} bytes)")
            try:
                with open(csv_path, 'r', encoding='utf-8', errors='ignore') as file:
                    print("First 5 lines:")
                    for i in range(5):
                        line = file.readline()
                        if not line:
                            break
                        print(line.strip())
            except Exception as e:
                print(f"Error reading CSV: {e}")

if __name__ == "__main__":
    main()
