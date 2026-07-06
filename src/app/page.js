"use client";

import { useState, useEffect, useMemo } from "react";
import { analyzeURL, analyzeEmailHeaders } from "../lib/phishingEngine";
import { 
  Search, 
  Mail, 
  Camera, 
  History, 
  GraduationCap, 
  Shield, 
  Download, 
  Smartphone, 
  Eye, 
  Brain, 
  Target, 
  Box, 
  Zap, 
  WifiOff 
} from "lucide-react";

// Import modular components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import UrlCheckerTab from "./components/UrlCheckerTab";
import EmailAnalyzerTab from "./components/EmailAnalyzerTab";
import QrScannerTab from "./components/QrScannerTab";
import HistoryTab from "./components/HistoryTab";
import SecurityGuideTab from "./components/SecurityGuideTab";
import SafeSandboxModal from "./components/SafeSandboxModal";

export default function Home() {
  const [activeTab, setActiveTab] = useState("check");
  const [urlInput, setUrlInput] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("ALL");

  // Deep Scan states
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [deepScanLoading, setDeepScanLoading] = useState(false);

  // Sandbox state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxTab, setSandboxTab] = useState("render");

  // Email Analyzer state
  const [emailHeadersInput, setEmailHeadersInput] = useState("");
  const [emailScanResult, setEmailScanResult] = useState(null);

  // Threat navigation items
  const navItems = useMemo(
    () => [
      { id: "check", icon: <Search size={18} />, label: "Check Link" },
      { id: "email", icon: <Mail size={18} />, label: "Email Headers" },
      { id: "qr", icon: <Camera size={18} />, label: "Scan QR" },
      { id: "history", icon: <History size={18} />, label: "History" },
      { id: "tips", icon: <GraduationCap size={18} />, label: "Security Guide" },
    ],
    []
  );

  // Compute threat stats from history
  const threatStats = useMemo(() => {
    const safe = scanHistory.filter((h) => h.rating === "SAFE").length;
    const suspicious = scanHistory.filter((h) => h.rating === "SUSPICIOUS").length;
    const dangerous = scanHistory.filter((h) => h.rating === "DANGEROUS").length;
    return { safe, suspicious, dangerous };
  }, [scanHistory]);

  // Check online/offline status & load history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const loadHistory = async () => {
        try {
          if (navigator.onLine) {
            const res = await fetch("/api/history");
            if (res.ok) {
              const data = await res.json();
              setScanHistory(data);
              localStorage.setItem("phishguard_history", JSON.stringify(data));
              return;
            }
          }
        } catch (e) {
          console.error("Failed to load history from database:", e);
        }

        const savedHistory = localStorage.getItem("phishguard_history");
        if (savedHistory) {
          setScanHistory(JSON.parse(savedHistory));
        } else {
          const mockHistory = [
            {
              url: "https://www.google.com",
              rating: "SAFE",
              score: 100,
              date: new Date(Date.now() - 3600000 * 2).toLocaleDateString(),
            },
            {
              url: "http://secure-paypal-login.com/update",
              rating: "DANGEROUS",
              score: 15,
              date: new Date(Date.now() - 3600000 * 24).toLocaleDateString(),
            },
          ];
          setScanHistory(mockHistory);
          localStorage.setItem("phishguard_history", JSON.stringify(mockHistory));
        }
      };

      loadHistory();

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Web Audio Success Beep
  const playSuccessBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("AudioContext block:", e);
    }
  };

  // Run Link Analysis
  const handleCheckUrl = async (urlToCheck) => {
    const targetUrl = urlToCheck || urlInput;
    if (!targetUrl.trim()) return;

    setDeepScanLoading(isDeepScan);
    let finalResult = analyzeURL(targetUrl);

    if (isDeepScan && isOnline) {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (response.ok) {
          const deepData = await response.json();
          finalResult.deepScan = deepData;

          let finalRiskScore = finalResult.riskScore;

          if (deepData.dns && !deepData.dns.active) {
            finalResult.warnings.push({
              id: "dns_inactive",
              title: "Inactive Domain / No DNS",
              desc: "This domain has no active DNS records. Phishing campaigns often deploy links using temporary domains that are taken offline quickly.",
              severity: "high",
              value: 40,
            });
            finalRiskScore += 40;
          }

          if (deepData.ssl) {
            if (!deepData.ssl.hasCert) {
              finalResult.warnings.push({
                id: "ssl_missing_cert",
                title: "Missing SSL Certificate",
                desc: "Could not retrieve a valid SSL certificate for HTTPS. The connection is insecure.",
                severity: "high",
                value: 30,
              });
              finalRiskScore += 30;
            } else {
              if (deepData.ssl.isExpired) {
                finalResult.warnings.push({
                  id: "ssl_expired",
                  title: "Expired SSL Certificate",
                  desc: `The SSL certificate for this domain expired on ${new Date(
                    deepData.ssl.validTo
                  ).toLocaleDateString()}.`,
                  severity: "medium",
                  value: 20,
                });
                finalRiskScore += 20;
              }
              if (deepData.ssl.isSelfSigned) {
                finalResult.warnings.push({
                  id: "ssl_self_signed",
                  title: "Self-Signed Certificate",
                  desc: "The website uses a self-signed certificate which is not trusted by web browsers.",
                  severity: "medium",
                  value: 25,
                });
                finalRiskScore += 25;
              }
            }
          }

          if (deepData.page && deepData.page.success) {
            if (deepData.page.hasPasswordInput) {
              finalResult.warnings.push({
                id: "page_password_field",
                title: "Login Form on Insecure/Suspicious Page",
                desc: "We detected password input fields on this page. Entering credentials here could expose them to hackers.",
                severity: "high",
                value: 35,
              });
              finalRiskScore += 35;
            }
            if (deepData.page.hasExternalForm) {
              finalResult.warnings.push({
                id: "page_external_submit",
                title: "External Form Submission Target",
                desc: "Data entered in forms on this website will be sent to a different domain. This is a common sign of credential harvesting.",
                severity: "high",
                value: 40,
              });
              finalRiskScore += 40;
            }
            if (deepData.page.hasMetaRedirect || deepData.page.hasScriptRedirect) {
              finalResult.warnings.push({
                id: "page_redirects",
                title: "Automatic Script Redirects",
                desc: "The page contains code that automatically redirects visitors. Phishers use this to evade security scrapers.",
                severity: "medium",
                value: 15,
              });
              finalRiskScore += 15;
            }
          }

          finalRiskScore = Math.min(100, Math.max(0, finalRiskScore));
          finalResult.riskScore = finalRiskScore;
          finalResult.score = 100 - finalRiskScore;

          if (finalRiskScore >= 70) {
            finalResult.rating = "DANGEROUS";
          } else if (finalRiskScore >= 35) {
            finalResult.rating = "SUSPICIOUS";
          } else {
            finalResult.rating = "SAFE";
          }
        }
      } catch (err) {
        console.error("Deep Scan Request failed:", err);
      } finally {
        setDeepScanLoading(false);
      }
    }

    setScanResult(finalResult);

    const newHistoryItem = {
      url: finalResult.url,
      rating: finalResult.rating,
      score: finalResult.score,
      date: new Date().toLocaleDateString(),
    };

    if (isOnline) {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHistoryItem),
      }).catch((e) => console.error("Failed to save to database:", e));
    }

    setScanHistory((prevHistory) => {
      const filtered = prevHistory.filter(
        (item) => item.url.toLowerCase() !== finalResult.url.toLowerCase()
      );
      const updated = [newHistoryItem, ...filtered].slice(0, 15);
      localStorage.setItem("phishguard_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckEmailHeaders = () => {
    if (!emailHeadersInput.trim()) return;
    const result = analyzeEmailHeaders(emailHeadersInput);
    setEmailScanResult(result);
  };

  const handleQrScanSuccess = (decodedUrl) => {
    playSuccessBeep();
    setUrlInput(decodedUrl);
    setActiveTab("check");
    handleCheckUrl(decodedUrl);
  };

  const handleClearInput = () => {
    setUrlInput("");
    setScanResult(null);
  };

  const handleClearEmailInput = () => {
    setEmailHeadersInput("");
    setEmailScanResult(null);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem("phishguard_history");
    if (isOnline) {
      fetch("/api/history", { method: "DELETE" })
        .catch((e) => console.error("Failed to clear database history:", e));
    }
  };

  const getRatingColorClass = (rating) => {
    if (rating === "SAFE") return "safe";
    if (rating === "SUSPICIOUS") return "suspicious";
    return "dangerous";
  };

  return (
    <div className="landing-layout">
      {/* ====== HEADER ====== */}
      <header className="landing-header">
        <div className="landing-logo-container">
          <img className="landing-logo" src="/ic_app_logo.png" alt="Secure OS Logo" />
          <span className="landing-title">Secure OS</span>
          <span className={`status-dot-mobile ${isOnline ? "live" : "offline"}`} title={isOnline ? "Live scan mode" : "Offline mode"}></span>
        </div>
        <div className="landing-header-links hide-on-mobile">
          <a onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })} className="landing-header-link">Features</a>
          <a onClick={() => document.getElementById("demo-suite").scrollIntoView({ behavior: "smooth" })} className="landing-header-link">Web Demo</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isOnline ? (
            <span className="online-badge hide-on-mobile-inline" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.25)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Zap size={11} /> Live Scan
            </span>
          ) : (
            <span className="offline-badge hide-on-mobile-inline" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.25)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <WifiOff size={11} /> Local
            </span>
          )}
          <a href="/app-debug.apk" download="SecureOS_v1.0.apk" className="btn btn-primary" style={{ minHeight: "38px", height: "38px", padding: "0 12px", fontSize: "13px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Download size={13} />
            <span className="hide-on-mobile-inline">Download App</span>
          </a>
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`}></span>
            <span className={`hamburger-bar ${menuOpen ? "open" : ""}`}></span>
          </button>
        </div>
      </header>

      {/* ====== MOBILE NAV DRAWER ====== */}
      <div className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`}>
        <a 
          onClick={() => {
            setMenuOpen(false);
            document.getElementById("features").scrollIntoView({ behavior: "smooth" });
          }} 
          className="mobile-nav-link"
        >
          Features
        </a>
        <a 
          onClick={() => {
            setMenuOpen(false);
            document.getElementById("demo-suite").scrollIntoView({ behavior: "smooth" });
          }} 
          className="mobile-nav-link"
        >
          Web Demo
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "20px" }}>
          {isOnline ? (
            <span className="online-badge" style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "14px", border: "1px solid rgba(16, 185, 129, 0.25)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Zap size={13} /> Security Live
            </span>
          ) : (
            <span className="offline-badge" style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "14px", border: "1px solid rgba(239, 68, 68, 0.25)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <WifiOff size={13} /> Local Scanner Mode
            </span>
          )}
        </div>
      </div>

      {/* ====== HERO CONTAINER ====== */}
      <section className="landing-hero-container">
        <div className="landing-hero-text">
          <span className="hero-tagline" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Shield size={12} className="text-purple-400" /> Anti-Phishing Ecosystem v2.0
          </span>
          <h1>Defend Against Cyber Threats <span>In Real-Time</span></h1>
          <p className="landing-hero-subtitle">
            Secure OS is a unified client-server security system. Download our lightweight native Android app to block zero-day scams offline, or try the interactive cloud scanning demo below.
          </p>
          <div className="landing-hero-ctas">
            <a href="/app-debug.apk" download="SecureOS_v1.0.apk" className="btn btn-primary" style={{ padding: "0 28px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Smartphone size={16} /> Download Android Client (APK)
            </a>
            <button onClick={() => document.getElementById("demo-suite").scrollIntoView({ behavior: "smooth" })} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Eye size={16} /> Launch Web Sandbox
            </button>
          </div>
        </div>

        <div className="landing-hero-graphic">
          <div className="shield-outer-circle">
            <div className="shield-inner-circle">
              <div className="radar-sweep"></div>
              <div className="pulse-ring-landing"></div>
              <div className="shield-core">
                <Shield size={54} className="shield-core-icon text-purple-400" style={{ strokeWidth: 1.5 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES SECTION ====== */}
      <section id="features" className="features-section" style={{ scrollMarginTop: "100px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="section-eyebrow" style={{ color: "var(--color-primary-light)", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1.5px" }}>Core Capabilities</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px" }}>Engine Features</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <Brain size={32} className="feature-card-icon text-purple-400" />
            <h3>On-Device ML Model</h3>
            <p>Runs a lightweight Logistic Regression classifier directly inside the app. Extracts URL properties locally with zero network delay and low battery usage.</p>
          </div>
          <div className="feature-card">
            <Target size={32} className="feature-card-icon text-cyan-400" />
            <h3>Typosquatting Shield</h3>
            <p>Uses Levenshtein Distance algorithms and Punycode decoders to instantly block fake lookalike links trying to impersonate popular brand sites.</p>
          </div>
          <div className="feature-card">
            <Box size={32} className="feature-card-icon text-pink-400" />
            <h3>Safe Rendering Sandbox</h3>
            <p>Isolates cookies, tokens, and active scripts to render a secure static preview of suspicious websites safely on your screen.</p>
          </div>
        </div>
      </section>

      {/* ====== WEB DEMO SECTION ====== */}
      <section id="demo-suite" className="landing-demo-section">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span className="section-eyebrow" style={{ color: "var(--color-primary-light)", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1.5px" }}>Interactive Playground</span>
          <h2 style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px" }}>Live Web Demo Suite</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>Verify links, QR codes, or raw email headers in real-time using our security stack.</p>
        </div>

        <div className="landing-demo-container">
          {/* Tabs Selector */}
          <div className="demo-header-tabs">
            <button
              onClick={() => setActiveTab("check")}
              className={`demo-tab-btn ${activeTab === "check" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Search size={14} /> Link Analyzer
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`demo-tab-btn ${activeTab === "email" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Mail size={14} /> Email Header Scanner
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`demo-tab-btn ${activeTab === "qr" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Camera size={14} /> QR Code Scanner
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`demo-tab-btn ${activeTab === "history" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <History size={14} /> Scan Logs
            </button>
            <button
              onClick={() => setActiveTab("tips")}
              className={`demo-tab-btn ${activeTab === "tips" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <GraduationCap size={14} /> Cybersecurity Quiz
            </button>
          </div>

          {/* Demo Content */}
          <div className="demo-content-body">
            {activeTab === "check" && (
              <UrlCheckerTab
                urlInput={urlInput}
                setUrlInput={setUrlInput}
                isDeepScan={isDeepScan}
                setIsDeepScan={setIsDeepScan}
                deepScanLoading={deepScanLoading}
                isOnline={isOnline}
                handleCheckUrl={handleCheckUrl}
                handleClearInput={handleClearInput}
                scanResult={scanResult}
                getRatingColorClass={getRatingColorClass}
                setShowSandbox={setShowSandbox}
                setSandboxTab={setSandboxTab}
              />
            )}

            {activeTab === "email" && (
              <EmailAnalyzerTab
                emailHeadersInput={emailHeadersInput}
                setEmailHeadersInput={setEmailHeadersInput}
                emailScanResult={emailScanResult}
                handleCheckEmailHeaders={handleCheckEmailHeaders}
                handleClearEmailInput={handleClearEmailInput}
                getRatingColorClass={getRatingColorClass}
              />
            )}

            {activeTab === "qr" && (
              <QrScannerTab handleQrScanSuccess={handleQrScanSuccess} />
            )}

            {activeTab === "history" && (
              <HistoryTab
                scanHistory={scanHistory}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                handleClearHistory={handleClearHistory}
                setUrlInput={setUrlInput}
                handleCheckUrl={handleCheckUrl}
                setActiveTab={setActiveTab}
                getRatingColorClass={getRatingColorClass}
              />
            )}

            {activeTab === "tips" && (
              <SecurityGuideTab />
            )}
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="landing-footer">
        <p>Developed for <span>Bhopal Hackathon 2026</span></p>
        <p>© 2026 Secure OS. Empowering users with advanced offline & online threat mitigation.</p>
      </footer>

      {/* ====== SAFE SANDBOX MODAL ====== */}
      <SafeSandboxModal
        showSandbox={showSandbox}
        setShowSandbox={setShowSandbox}
        scanResult={scanResult}
        sandboxTab={sandboxTab}
        setSandboxTab={setSandboxTab}
        getRatingColorClass={getRatingColorClass}
      />
    </div>
  );
}
