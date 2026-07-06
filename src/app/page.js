"use client";

import { useState, useEffect, useMemo } from "react";
import { analyzeURL, analyzeEmailHeaders } from "../lib/phishingEngine";

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
      { id: "check", icon: "🔍", label: "Check Link" },
      { id: "email", icon: "📧", label: "Email Headers" },
      { id: "qr", icon: "📷", label: "Scan QR" },
      { id: "history", icon: "📜", label: "History" },
      { id: "tips", icon: "🎓", label: "Security Guide" },
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
  };

  const getRatingColorClass = (rating) => {
    if (rating === "SAFE") return "safe";
    if (rating === "SUSPICIOUS") return "suspicious";
    return "dangerous";
  };

  return (
    <div className="dashboard-layout">
      {/* ====== SIDEBAR (Desktop only) ====== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        threatStats={threatStats}
        navItems={navItems}
        isOnline={isOnline}
      />

      {/* ====== MOBILE HEADER ====== */}
      <Header isOnline={isOnline} />

      {/* ====== MAIN CONTENT ====== */}
      <main className="main-content">
        <div className="app-main">
          {/* ===== VIEW 1: URL CHECKER ===== */}
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

          {/* ===== VIEW 2: EMAIL HEADER ANALYZER ===== */}
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

          {/* ===== VIEW 3: QR CODE SCANNER ===== */}
          {activeTab === "qr" && <QrScannerTab handleQrScanSuccess={handleQrScanSuccess} />}

          {/* ===== VIEW 4: HISTORY ===== */}
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

          {/* ===== VIEW 5: SECURITY GUIDE + QUIZ ===== */}
          {activeTab === "tips" && <SecurityGuideTab />}
        </div>
      </main>

      {/* ====== BOTTOM NAV ====== */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} navItems={navItems} />

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
