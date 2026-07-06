"use client";

import { useMemo } from "react";

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
    <div className="dual-panel">
      {/* Left Panel — Input */}
      <div className="panel-left">
        <div className="glass-card checker-box">
          <span className="section-eyebrow">🛡️ Threat Engine v2.0</span>
          <h2 className="panel-title">Verify Link Safety</h2>
          <p className="hero-subtitle">
            Paste or type a suspicious URL. Our ML engine + heuristic analyzer gives you a real-time safety score.
          </p>

          <div className="input-wrapper">
            <span className="input-icon">🔗</span>
            <input
              type="text"
              placeholder="e.g. secure-paypal-update.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="url-input"
              onKeyDown={(e) => e.key === "Enter" && handleCheckUrl()}
            />
            {urlInput && (
              <button onClick={handleClearInput} className="clear-btn">
                ✕
              </button>
            )}
          </div>

          <div className="deep-scan-toggle-container">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={isDeepScan}
                onChange={(e) => setIsDeepScan(e.target.checked)}
                disabled={!isOnline}
              />
              <span className="switch-custom"></span>
              <span className="switch-text">
                Deep Scan — DNS resolution + SSL certificate lookup
                {!isOnline && (
                  <span style={{ color: "var(--color-danger)", marginLeft: "6px" }}>(offline)</span>
                )}
              </span>
            </label>
          </div>

          <button
            onClick={() => handleCheckUrl()}
            className="btn btn-primary btn-full"
            style={{ marginTop: "14px" }}
            disabled={!urlInput.trim() || deepScanLoading}
          >
            {deepScanLoading ? (
              <span className="loading-spinner-text">
                <span className="spinner"></span> Running Deep Analysis...
              </span>
            ) : (
              <>🛡️ Analyze Link Safety</>
            )}
          </button>
        </div>

        {/* Tips Shortcut Card */}
        <div className="glass-card quick-tips-card">
          <span className="quick-tips-label">💡 Quick Detection Tips</span>
          <div className="tip-pills">
            {[
              { icon: "🔒", text: "Always check for 'https://' protocol" },
              { icon: "🔤", text: "Spot brand-mimicking typos (paypa1.com)" },
              { icon: "🌐", text: "Too many subdomains = red flag" },
              { icon: "🔗", text: "Scan bit.ly / tinyurl before clicking" },
            ].map((tip, i) => (
              <div key={i} className="tip-pill">
                <span className="tip-pill-icon">{tip.icon}</span>
                {tip.text}
              </div>
            ))}
          </div>
        </div>

        {/* Download Android App Card */}
        <div className="glass-card download-app-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid rgba(6, 182, 212, 0.25)", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)", marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "26px" }}>🤖</span>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "2px" }}>Secure OS for Android</h4>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>Get real-time offline protection, clipboard checks, and secure QR scanning on your mobile device.</p>
            </div>
          </div>
          <a
            href="/app-debug.apk"
            download="SecureOS_v1.0.apk"
            className="btn btn-secondary btn-full"
            style={{ minHeight: "36px", height: "36px", fontSize: "13px", color: "var(--color-secondary)", borderColor: "rgba(6, 182, 212, 0.3)", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            📥 Download Android App (APK)
          </a>
        </div>
      </div>

      {/* Right Panel — Results */}
      <div className="panel-right">
        {deepScanLoading ? (
          <div className="glass-card loading-panel">
            <div className="spinner"></div>
            <h3>Running Deep Analysis...</h3>
            <p>Performing DNS resolution, SSL certificate check, and HTML content analysis on the target server.</p>
          </div>
        ) : scanResult ? (
          <div className="glass-card result-panel-card">
            {/* Score Gauge + Rating Header */}
            <div className={`result-header ${getRatingColorClass(scanResult.rating)}`}>
              <div className="score-gauge-container">
                <svg className="score-gauge" viewBox="0 0 140 140">
                  <circle className="circle-bg" cx="70" cy="70" r="55" />
                  <circle
                    className={`circle-progress ${getRatingColorClass(scanResult.rating)}`}
                    cx="70"
                    cy="70"
                    r="55"
                    strokeDasharray={2 * Math.PI * 55}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="score-text-wrapper">
                  <span className="score-num">{scanResult.score}</span>
                  <span className="score-label">Safety</span>
                </div>
              </div>
              <div className={`rating-badge ${getRatingColorClass(scanResult.rating)}`}>
                {scanResult.rating === "SAFE" ? "✅" : scanResult.rating === "SUSPICIOUS" ? "⚠️" : "🚨"} {scanResult.rating}
              </div>
              <p className="result-url">{scanResult.url}</p>
            </div>

            {/* URL Breakdown Visualizer */}
            {scanResult.breakdown && (
              <div className="url-breakdown-wrapper">
                <div className="url-breakdown-title">🔗 URL Structure Breakdown</div>
                <div className="url-breakdown-box">
                  <span
                    className={`breakdown-part protocol ${scanResult.breakdown.protocol.isSafe ? "safe" : "danger"}`}
                  >
                    {scanResult.breakdown.protocol.text}://
                  </span>
                  {scanResult.breakdown.subdomains.map((sub, i) => (
                    <span key={i} className="breakdown-part subdomain">
                      {sub}.
                    </span>
                  ))}
                  <span
                    className={`breakdown-part domain ${scanResult.breakdown.typosquatTarget ? "danger" : "normal"}`}
                  >
                    {scanResult.breakdown.primaryDomainName}
                  </span>
                  <span className="breakdown-part tld">.{scanResult.domain.split(".").pop()}</span>
                  {scanResult.breakdown.path && scanResult.breakdown.path !== "/" && (
                    <span className="breakdown-part path">{scanResult.breakdown.path}</span>
                  )}
                </div>
                {scanResult.breakdown.typosquatTarget && (
                  <div className="breakdown-alert">
                    ⚠️ Mimics verified domain:{" "}
                    <strong style={{ color: "var(--color-danger)", marginLeft: "4px" }}>
                      {scanResult.breakdown.typosquatTarget}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Brand Comparison */}
            {scanResult.rating !== "SAFE" && matchedBrand && (
              <div className="brand-comparison-wrapper">
                <div className="brand-comparison-title">❌ Brand Spoofing Detected</div>
                <div className="brand-comparison-grid">
                  <div className="comparison-card suspicious-card">
                    <div className="comparison-status">SUSPICIOUS PATH</div>
                    <div className="comparison-domain">{scanResult.domain}</div>
                    <div className="comparison-indicator red">⚠ Mimic Target</div>
                  </div>
                  <div className="comparison-card safe-card">
                    <div className="comparison-status">GENUINE BRAND</div>
                    <div className="comparison-domain">{matchedBrand}</div>
                    <div className="comparison-indicator green">✓ Safe Official</div>
                  </div>
                </div>
              </div>
            )}

            <div className="result-details">
              {/* Sandbox Preview Button */}
              <button
                onClick={() => {
                  setShowSandbox(true);
                  setSandboxTab("render");
                }}
                className="btn btn-secondary btn-full"
                style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}
              >
                🌐 Open Safe Browser Sandbox
              </button>

              {/* Threat Factor Warnings */}
              {scanResult.warnings.length > 0 && (
                <div>
                  <h3 className="detail-section-title">⚠️ Threat Factors ({scanResult.warnings.length})</h3>
                  <div className="warning-list">
                    {scanResult.warnings.map((warning, idx) => (
                      <div key={idx} className={`warning-item severity-${warning.severity}`}>
                        <div className="warning-item-header">
                          <span className="warning-title">{warning.title}</span>
                          <span className="warning-severity">{warning.severity} Risk</span>
                        </div>
                        <p className="warning-desc">{warning.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe Signals */}
              {scanResult.safeIndicators.length > 0 && (
                <div>
                  <h3 className="detail-section-title">
                    <span className="safe-icon">✓</span> Security Controls Passed
                  </h3>
                  <div className="safe-list">
                    {scanResult.safeIndicators.map((indicator, index) => (
                      <div key={index} className="safe-item">
                        <span className="safe-icon">✓</span>
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Metadata */}
              <div>
                <h3 className="detail-section-title">⚙️ Technical Metadata</h3>
                <div className="features-grid">
                  <div className="feature-pill">
                    <span className="feature-pill-label">TLD Dots</span>
                    <span className="feature-pill-val">{scanResult.features.nb_dots}</span>
                  </div>
                  <div className="feature-pill">
                    <span className="feature-pill-label">HTTPS</span>
                    <span className={`feature-pill-val ${scanResult.features.isHttps ? "highlight" : ""}`}>
                      {scanResult.features.isHttps ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="feature-pill">
                    <span className="feature-pill-label">Keywords</span>
                    <span className="feature-pill-val">{scanResult.features.sensitive_words_count}</span>
                  </div>
                  <div className="feature-pill">
                    <span className="feature-pill-label">ML Prob.</span>
                    <span className="feature-pill-val">{(scanResult.mlProbability * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Deep Scan Details */}
              {scanResult.deepScan && (
                <div>
                  <h3 className="detail-section-title">🕵️ Live Server Analysis</h3>
                  <div className="deep-scan-meta-list">
                    <div className="meta-row">
                      <span className="meta-label">IP Address</span>
                      <span className="meta-value">{scanResult.deepScan.dns?.ip || "Not Resolving"}</span>
                    </div>
                    {scanResult.deepScan.ssl?.hasCert && (
                      <>
                        <div className="meta-row">
                          <span className="meta-label">SSL Issuer</span>
                          <span className="meta-value">{scanResult.deepScan.ssl.issuer}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">SSL Expiry</span>
                          <span className="meta-value">
                            {new Date(scanResult.deepScan.ssl.validTo).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                    {scanResult.deepScan.page?.success && (
                      <>
                        <div className="meta-row">
                          <span className="meta-label">Server Title</span>
                          <span
                            className="meta-value"
                            style={{ wordBreak: "break-all", textAlign: "right" }}
                          >
                            "{scanResult.deepScan.page.title}"
                          </span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-label">Detected Forms</span>
                          <span className="meta-value">{scanResult.deepScan.page.loginFormsCount}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card result-placeholder">
            <div className="shield-check-icon">🛡️</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "750",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Awaiting Analysis
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "260px" }}>
              Enter a URL on the left and click "Analyze Link Safety" to get a full security breakdown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
