"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  Shield, 
  Link2, 
  Download, 
  Lightbulb, 
  Lock, 
  HelpCircle, 
  Globe, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  ShieldCheck, 
  Settings, 
  Activity,
  ArrowRight,
  RefreshCw,
  Search,
  Server
} from "lucide-react";

export default function UrlCheckerTab({
  urlInput,
  setUrlInput,
  isDeepScan,
  setIsDeepScan,
  deepScanLoading,
  isOnline,
  handleCheckUrl,
  handleClearInput,
  scanResult,
  getRatingColorClass,
  setShowSandbox,
  setSandboxTab,
}) {
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [localScanning, setLocalScanning] = useState(false);

  const scanSteps = [
    "Resolving host DNS headers...",
    "Querying SSL handshake protocols...",
    "Extracting domain entropy vectors...",
    "Calculating Levenshtein edit distance...",
    "Applying Logistic weights classifier...",
    "Aggregating security heuristic verdicts..."
  ];

  useEffect(() => {
    let interval;
    if (localScanning || deepScanLoading) {
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev + 1) % scanSteps.length);
      }, 300);
    } else {
      setTimeout(() => setScanStepIndex(0), 0);
    }
    return () => clearInterval(interval);
  }, [localScanning, deepScanLoading, scanSteps.length]);

  const handleSubmit = (e) => {
    if (!urlInput.trim()) return;
    setLocalScanning(true);
    setTimeout(() => {
      handleCheckUrl();
      setLocalScanning(false);
    }, 1800);
  };

  const isScanningActive = localScanning || deepScanLoading;

  const strokeDashoffset = useMemo(() => {
    return scanResult
      ? 2 * Math.PI * 55 * (1 - scanResult.score / 100)
      : 2 * Math.PI * 55;
  }, [scanResult]);

  const matchedBrand = useMemo(() => {
    if (!scanResult) return null;
    const typosquatWarning = scanResult.warnings.find(
      (w) => w.id === "typosquatting" || w.id === "homograph_attack"
    );
    return (
      typosquatWarning?.desc.match(/mimics a highly visited website \(([^)]+)\)/)?.[1] ||
      typosquatWarning?.desc.match(/'([^']+)' but is not/)?.[1] ||
      (scanResult.domain.includes("google")
        ? "google.com"
        : scanResult.domain.includes("paypal")
        ? "paypal.com"
        : scanResult.domain.includes("meta")
        ? "metamask.io"
        : null)
    );
  }, [scanResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: Input Form and Quick Settings */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary mb-4">
            <Shield className="h-3 w-3" />
            AI Threat Engine v2.0
          </div>
          <h2 className="text-lg font-bold text-navy">Verify Link Safety</h2>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            Enter a domain or a deep page link to inspect threat indicators, brand spoofing parameters, and SSL validations.
          </p>

          <div className="mt-5 space-y-4">
            {/* Input Wrapper */}
            <div className="relative flex items-center">
              <Link2 className="h-4.5 w-4.5 text-text-muted absolute left-3.5" />
              <input
                type="text"
                placeholder="e.g. secure-paypal-verify.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-sm outline-none focus:border-primary transition-colors text-text-primary placeholder:text-text-muted"
              />
              {urlInput && (
                <button onClick={handleClearInput} className="absolute right-3.5 p-1 rounded-full hover:bg-slate-100 text-xs text-text-muted">
                  ✕
                </button>
              )}
            </div>

            {/* Deep Scan toggle */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeepScan}
                  onChange={(e) => setIsDeepScan(e.target.checked)}
                  disabled={!isOnline}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-navy block">Deep Inspection Protocol</span>
                  <span className="text-[10px] text-text-secondary mt-0.5 block">
                    Verify DNS active records and pull remote SSL certificate parameters.
                    {!isOnline && (
                      <span className="text-danger ml-1 font-semibold">(Requires network connection)</span>
                    )}
                  </span>
                </div>
              </label>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={handleSubmit}
              disabled={!urlInput.trim() || isScanningActive}
              className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isScanningActive ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing Link Safety...
                </span>
              ) : (
                "Run Diagnostic Scan"
              )}
            </button>
          </div>
        </div>

        {/* Quick Tips Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-navy mb-4">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Detection Indicators
          </div>
          <div className="space-y-3">
            {[
              { icon: <Lock className="h-3.5 w-3.5 text-green-500" />, text: "Official websites always employ HTTPS/SSL." },
              { icon: <HelpCircle className="h-3.5 w-3.5 text-blue-500" />, text: "Watch for numeric characters mimicking alphabets." },
              { icon: <Globe className="h-3.5 w-3.5 text-indigo-500" />, text: "Multi-layered subdomains denote obfuscation." },
              { icon: <Smartphone className="h-3.5 w-3.5 text-accent" />, text: "Scan QR codes in sandboxes first." }
            ].map((tip, i) => (
              <div key={i} className="flex gap-2.5 items-center text-xs text-text-secondary">
                {tip.icon}
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Native App promo card */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-10">
            <Smartphone className="h-40 w-40" />
          </div>
          <h4 className="font-heading font-bold text-xs">On-Device Protection Client</h4>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Get offline local ML evaluation, sandbox renderings, and browser integrations on Android endpoints.
          </p>
          <a
            href="/app-debug.apk"
            download="SecureOS_v1.0.apk"
            className="mt-4 w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download APK File
          </a>
        </div>
      </div>

      {/* RIGHT PANEL: Results or loading skeletons */}
      <div className="lg:col-span-7">
        
        {/* SCANNING IN PROGRESS STATE */}
        {isScanningActive ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-16 space-y-6">
            
            {/* Spinning Radar Circle */}
            <div className="relative flex items-center justify-center mx-auto h-20 w-20 rounded-full bg-primary/5 border border-primary/10">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-ring"></div>
            </div>

            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base text-navy">AI Threat Diagnostics Running</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Dissecting URL parameters, checking homograph patterns, and validating hostname entropy.
              </p>
            </div>

            {/* Sweeping Step Text */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-text-secondary font-mono">
              <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>{scanSteps[scanStepIndex]}</span>
            </div>

            {/* Progress Bar Animation */}
            <div className="w-full max-w-xs mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="absolute h-full w-1/3 bg-primary rounded-full animate-scanning-bar"></div>
            </div>

            {/* Skeletons block */}
            <div className="space-y-3 pt-6 border-t border-slate-100 text-left">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
                    <div className="h-2 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : scanResult ? (
          
          /* RESULTS STATE */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Header safety bar */}
            <div className={`p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              scanResult.rating === "SAFE" ? "bg-green-50/40" :
              scanResult.rating === "SUSPICIOUS" ? "bg-amber-50/40" :
              "bg-red-50/40"
            }`}>
              <div className="flex items-center gap-4">
                {/* Visual score circle */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke={scanResult.rating === "SAFE" ? "#16A34A" : scanResult.rating === "SUSPICIOUS" ? "#D97706" : "#DC2626"}
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - scanResult.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-extrabold text-navy leading-none">{scanResult.score}</span>
                    <span className="text-[7px] text-text-muted mt-0.5">Safety</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-navy leading-none">Diagnostic Result</h3>
                  <span className="text-xs text-text-secondary mt-1 block truncate max-w-[280px] sm:max-w-md select-all">{scanResult.url}</span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold self-start sm:self-auto border ${
                scanResult.rating === "SAFE" ? "bg-green-100 text-green-800 border-green-200" :
                scanResult.rating === "SUSPICIOUS" ? "bg-amber-100 text-amber-800 border-amber-200" :
                "bg-red-100 text-red-800 border-red-200"
              }`}>
                {scanResult.rating === "SAFE" ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                 scanResult.rating === "SUSPICIOUS" ? <AlertTriangle className="h-3.5 w-3.5" /> : 
                 <ShieldAlert className="h-3.5 w-3.5" />}
                {scanResult.rating}
              </span>
            </div>

            <div className="p-6 space-y-6">
              
              {/* URL STRUCTURE VISUALIZER */}
              {scanResult.breakdown && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-text-muted" />
                    URL Struct Breakdown
                  </h4>
                  <div className="font-mono text-xs p-3.5 bg-slate-50 border border-slate-100 rounded-xl overflow-x-auto select-all flex flex-wrap gap-y-1">
                    <span className={`font-semibold ${scanResult.breakdown.protocol.isSafe ? "text-green-600" : "text-red-500 font-bold"}`}>
                      {scanResult.breakdown.protocol.text}://
                    </span>
                    {scanResult.breakdown.subdomains.map((sub, i) => (
                      <span key={i} className="text-text-secondary">
                        {sub}.
                      </span>
                    ))}
                    <span className={`font-bold ${scanResult.breakdown.typosquatTarget ? "text-red-600 bg-red-50" : "text-navy"}`}>
                      {scanResult.breakdown.primaryDomainName}
                    </span>
                    <span className="text-text-muted">.{scanResult.domain.split(".").pop()}</span>
                    {scanResult.breakdown.path && scanResult.breakdown.path !== "/" && (
                      <span className="text-text-secondary">{scanResult.breakdown.path}</span>
                    )}
                  </div>
                  {scanResult.breakdown.typosquatTarget && (
                    <div className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Impersonates verified domain: {scanResult.breakdown.typosquatTarget}
                    </div>
                  )}
                </div>
              )}

              {/* BRAND COMPS */}
              {scanResult.rating !== "SAFE" && matchedBrand && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    Brand Abuse Comparison
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-red-100 bg-red-50/50 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-red-700 font-bold">SUSPICIOUS HOST</span>
                        <span className="block text-xs font-bold text-navy mt-1 truncate">{scanResult.domain}</span>
                      </div>
                      <span className="text-[9px] text-red-700 font-semibold mt-3 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Spoof Attempt
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl border border-green-100 bg-green-50/50 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-green-700 font-bold">LEGITIMATE TARGET</span>
                        <span className="block text-xs font-bold text-navy mt-1 truncate">{matchedBrand}</span>
                      </div>
                      <span className="text-[9px] text-green-700 font-semibold mt-3 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Official Site
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive sandboxed renderer button */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSandbox(true);
                    setSandboxTab("render");
                  }}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-navy shadow-sm transition-all"
                >
                  <Globe className="h-3.5 w-3.5" /> Launch Sandbox Safe render
                </button>
              </div>

              {/* Threat factors list */}
              {scanResult.warnings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Threat Indicators Detected ({scanResult.warnings.length})
                  </h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {scanResult.warnings.map((warning, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-navy">{warning.title}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            warning.severity === "high" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {warning.severity} Risk
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{warning.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe signals passed */}
              {scanResult.safeIndicators.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                    Security Controls Passed
                  </h4>
                  <div className="space-y-2">
                    {scanResult.safeIndicators.map((indicator, index) => (
                      <div key={index} className="flex gap-2 items-center text-xs text-text-secondary bg-green-50/30 p-2.5 rounded-xl border border-green-100/30">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical model parameters */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-text-muted" />
                  Model Feature Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] text-text-muted block font-medium">TLD Dots</span>
                    <span className="text-xs font-bold text-navy mt-0.5 block">{scanResult.features.nb_dots}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] text-text-muted block font-medium">HTTPS Protocol</span>
                    <span className={`text-xs font-bold mt-0.5 block ${scanResult.features.isHttps ? "text-green-600" : "text-red-500"}`}>
                      {scanResult.features.isHttps ? "Active" : "None"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] text-text-muted block font-medium">Keywords Density</span>
                    <span className="text-xs font-bold text-navy mt-0.5 block">{scanResult.features.sensitive_words_count}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] text-text-muted block font-medium">ML Prob. Weights</span>
                    <span className="text-xs font-bold text-navy mt-0.5 block">{(scanResult.mlProbability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Deep Live DNS server result details */}
              {scanResult.deepScan && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-text-muted" />
                    Live DNS & SSL Server Metadata
                  </h4>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Target IP Address</span>
                      <span className="font-bold text-navy font-mono">{scanResult.deepScan.dns?.ip || "Host Not Resolving"}</span>
                    </div>
                    {scanResult.deepScan.ssl?.hasCert && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-muted">SSL Certificate Issuer</span>
                          <span className="font-bold text-navy font-mono truncate max-w-[240px]">{scanResult.deepScan.ssl.issuer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">SSL Expiration Date</span>
                          <span className="font-bold text-navy font-mono">{new Date(scanResult.deepScan.ssl.validTo).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                    {scanResult.deepScan.page?.success && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Live Render Server Title</span>
                          <span className="font-bold text-navy truncate max-w-[240px]">&quot;{scanResult.deepScan.page.title}&quot;</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Login Forms Count</span>
                          <span className="font-bold text-navy font-mono">{scanResult.deepScan.page.loginFormsCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          
          /* PLACEHOLDER / AWAITING CHECK */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-20 px-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mx-auto text-text-muted">
              <Shield className="h-8 w-8 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-navy">Awaiting Security Evaluation</h3>
              <p className="text-xs text-text-secondary max-w-[280px] mx-auto leading-relaxed">
                Submit a URL on the left panel to scan structural characteristics, SSL records, and DNS profiles.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
