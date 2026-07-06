# Secure OS — Anti-Phishing Ecosystem v2.0

Secure OS is a unified client-server security system designed to defend against modern cyber threats in real-time. It features an interactive Next.js web application and a companion Android client for complete protection.

---

## 🚀 Key Features

*   **Link Analyzer (URL Checker):** ML-powered phishing URL classifier checking Shannon entropy, typosquatting (Levenshtein distance), subdomains count, and deep server analysis (DNS/SSL credentials validation).
*   **Email Header Analyzer:** Checks SPF, DKIM, and DMARC parameters of raw email headers to verify sender integrity and detect spoofing.
*   **QR Code Scanner:** Scans QR codes securely from a live webcam feed or image upload to extract and pre-screen URLs.
*   **Safe Preview Sandbox:** Isolates scripts, cookies, and forms to render a static sandboxed DOM preview of suspicious sites securely.
*   **Offline Mode:** Supported by local heuristic fallbacks inside the companion Android client when internet connectivity is lost.
*   **Cybersecurity Guide & Quiz:** Training modules and interactive skill quizzes to educate users on visual threat signals.

---

## 🛠️ Tech Stack

*   **Web Framework:** Next.js (App Router, React 19)
*   **Icons:** Lucide React
*   **Styles:** Modular Vanilla CSS (designed for high-aesthetics glassmorphism, responsive/mobile-first viewports)
*   **Engine Logic:** JavaScript-based feature extraction and heuristics

---

## ⚙️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 📁 Repository Structure

*   `src/app/` — Next.js frontend pages, layout, and global styles.
*   `src/app/components/` — Modular panels (`UrlCheckerTab`, `EmailAnalyzerTab`, `QrScannerTab`, `HistoryTab`, `SecurityGuideTab`, `SafeSandboxModal`, `Sidebar`, `BottomNav`).
*   `src/lib/` — Anti-phishing ML analysis core engines and heuristics.
*   `android-app/` — Source code for the native Android scanner application.
*   `public/` — Static assets (logo, APK builds, and configuration manifests).
*   `scripts/` — Auxiliary Python research and dataset downloader scripts.
