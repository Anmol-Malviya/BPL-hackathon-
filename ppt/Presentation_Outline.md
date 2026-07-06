# PhishGuard Presentation Slides Outline

This file contains the complete content for the **PhishGuard** presentation slides. You can use this outline to build slides on **Google Slides**, **Canva**, or any slide creator, or use the automatically generated PowerPoint presentation file: [PhishGuard_Presentation.pptx](file:///c:/Users/anmol/OneDrive/Desktop/Projects/bhopal%20hacathon/BPL-hackathon-/ppt/PhishGuard_Presentation.pptx).

---

## Slide 1: Title Slide (Dark/Professional Background)
* **Main Title:** PHISHGUARD
* **Subtitle:** A Hybrid Client-Server System for Real-Time Phishing & Cyber Crime Mitigation
* **Visuals:** Modern Cybersecurity Shield Logo
* **Footer/Presenter Details:**
  * **Team Name:** PhishGuard Solutions (Modify as needed)
  * **Team Members:** 
    * [Member 1 Name] - Role: Frontend/App Developer
    * [Member 2 Name] - Role: Backend & Security Analyst
    * [Member 3 Name] - Role: ML Engineer / Researcher
  * **Event:** Bhopal Hackathon 2026

---

## Slide 2: The Rising Cyber Crime Threat (Problem Statement)
* **Headline:** The Phishing & Social Engineering Crisis
* **Key Challenges:**
  * **Financial & Identity Risk:** Phishing accounts for over 80% of all reported cyber incidents.
  * **Short-lived Zero-Day Domains:** Malicious links are deployed on temporary domains that stay active for less than 24 hours, making static URL blacklists (like Google Safe Browsing) ineffective.
  * **Quishing (QR Code Phishing):** QR codes on physical bills or public spaces hide malicious links, driving users to phishing sites blindly.
  * **Advanced Spoofing:** IDN Homograph attacks (fake Cyrillic letters looking like English letters) make fraud URLs look identical to trusted brand names.
* **The Gap:** Ordinary citizens lack simple, real-time, zero-latency tools to inspect links, QR codes, and email headers without exposing themselves to threat payloads.

---

## Slide 3: Proposed Solution (PhishGuard)
* **Headline:** Proposed Solution: PhishGuard
* **Core Philosophy:** A multi-layered, interactive security ecosystem that checks URLs, emails, and QR codes before the user clicks, combining local low-latency AI with cloud-driven sandbox analysis.
* **Three Pillars of Security:**
  1. **Local Mobile Engine (Android App):** Runs an offline Machine Learning classifier (Logistic Regression) and heuristic checks on-device to flag typosquatting, Punycode mappings, and entropy with zero network delay.
  2. **Server-Side Deep Scan API:** A Node.js backend executing active DNS lookups, verifying full SSL chains (identifying self-signed or expired certificates), and auditing the target HTML DOM layout.
  3. **Safe Rendering Sandbox:** An isolated viewer that renders a visual image of the site in a script-restricted container so users can inspect it safely without downloading malware or trackers.

---

## Slide 4: How the Solution Works (System Flow)
* **Headline:** The Detection & Verification Pipeline
* **Step-by-Step Flow:**
  1. **User Input:** User pastes a URL, uploads an email header, or scans a physical QR code using PhishGuard.
  2. **On-Device Diagnostics:**
     * *Levenshtein Distance Check:* Compares domain tokens with top 100 brands to flag typosquatting (e.g. `paypa1.com` instead of `paypal.com`).
     * *Homograph Verification:* Detects Cyrillic text characters (`xn--`).
     * *Entropy Scan:* Checks for random-character generator patterns.
  3. **Mobile ML Prediction:** A local Logistic Regression model uses custom weights (trained on 10,000+ URLs) to output a rapid, on-device probability score.
  4. **Dynamic API deep-scan:** If connected, the client triggers the Next.js API to perform DNS check, fetch SSL certificates, and check HTML source for forms requesting passwords submitting to third-party domains.

---

## Slide 5: Major Components of the System
* **Headline:** Key Modules in the PhishGuard Ecosystem
* **Core Subsystems:**
  * **Native Android Application (Kotlin):** Automated clipboard monitoring, local ML inference, camera-integrated QR code scanner, and direct history logging.
  * **Next.js Web Dashboard:** A public, responsive UI offering manual scanning, history filters, and interactive widgets.
  * **Cloud Deep-Scan Microservice:** API that checks DNS, performs TLS handshakes, and analyzes page source layout.
  * **Safe Sandbox Preview Module:** Generates and displays a secure page preview with active JavaScript/cookies sandboxed and disabled.
  * **Digital Literacy Portal:** A gamified "Security Guide" with interactive cybersecurity quizzes to train the human layer.

---

## Slide 6: System Architecture & Tech Stack
* **Headline:** Architecture & Technology Stack
* **Software Stack:**
  * **Mobile:** Native Android, Kotlin SDK, Web Audio API
  * **Frontend:** Next.js (React), Tailwind CSS, Vanilla CSS (Glassmorphism & animations)
  * **Backend:** Next.js Serverless API Routes (Node.js)
  * **Libraries:** `html5-qrcode` for camera processing, DNS resolution client
  * **Data & Models:** Python scripting for dataset preprocessing (`download_dataset.py`, `analyze_dataset.py`) and JSON-based weight distribution for cross-platform model deployment.
* **Core Security Algorithms:**
  * **Levenshtein Distance:** Brand typo matching
  * **Shannon Entropy:** Obfuscated domain detection
  * **Logistic Regression Classifier:** Multi-feature URL threat grading

---

## Slide 7: Impact on Cybersecurity & Society
* **Headline:** Security & Social Impact
* **How it Empowers the Public:**
  * **Proactive Defense:** Moves from reactive blacklist checking to proactive structural evaluation of links.
  * **Zero-Day Resilience:** Detects brand new scams instantly using ML heuristics, even if the domain was purchased just minutes prior.
  * **Protects Physical Spaces:** Blocks "Quishing" in offline environments (restaurants, public parking meters, delivery packages).
  * **Bridges the Tech Divide:** Simple red/yellow/green ratings make security understandable for elders and non-technical citizens.

---

## Slide 8: Working Prototype & Demo
* **Headline:** Live Prototype Overview
* **Interactive Features to Demo:**
  * **Check Link Interface:** Enter a link (e.g. `http://secure-paypal-login.com/update`) and see real-time triggers: *Insecure Connection*, *Typosquatting*, *Sensitive Keywords*, and *Missing DNS*.
  * **Sandbox Mode:** View the rendering of a target website without running dangerous script vectors.
  * **Email Header Analyzer:** Paste headers to verify sender validity.
  * **QR Code Scanner:** Scan barcode URLs directly using the camera.
  * **Gamified Quiz:** Prove cyber-awareness in the interactive security simulator.
