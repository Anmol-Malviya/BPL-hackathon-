"use client";

import { useMemo } from "react";

export default function EmailAnalyzerTab({
  emailHeadersInput,
  setEmailHeadersInput,
  emailScanResult,
  handleCheckEmailHeaders,
  handleClearEmailInput,
  getRatingColorClass,
}) {
  const emailStrokeDashoffset = useMemo(() => {
    return emailScanResult
      ? 2 * Math.PI * 55 * (1 - emailScanResult.score / 100)
      : 2 * Math.PI * 55;
  }, [emailScanResult]);

  return (
    <div className="dual-panel">
      {/* Left Panel — Input */}
      <div className="panel-left">
        <div className="glass-card checker-box">
          <span className="section-eyebrow">📨 Sender Authentication</span>
          <h2 className="panel-title">Email Header Analyzer</h2>
          <p className="hero-subtitle">
            Paste raw email headers to verify SPF, DKIM, and DMARC. Detect domain spoofing and forged senders.
          </p>

          <textarea
            placeholder={
              "Paste raw email headers here...\ne.g. From: noreply@paypal.com\nReturn-Path: <bounce@phishmail.ru>\nReceived-SPF: fail (phishmail.ru is not allowed)"
            }
            value={emailHeadersInput}
            onChange={(e) => setEmailHeadersInput(e.target.value)}
            className="email-headers-input mt-2"
            rows={10}
          />

          <div className="email-actions mt-4">
            <button
              onClick={handleCheckEmailHeaders}
              className="btn btn-primary btn-full"
              disabled={!emailHeadersInput.trim()}
            >
              📧 Scan Sender Authentication
            </button>
            {emailHeadersInput && (
              <button onClick={handleClearEmailInput} className="btn btn-secondary btn-full mt-2">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel — Email Results */}
      <div className="panel-right">
        {emailScanResult ? (
          <div className="glass-card result-panel-card">
            <div className="result-header">
              <div className="score-gauge-container">
                <svg className="score-gauge" viewBox="0 0 140 140">
                  <circle className="circle-bg" cx="70" cy="70" r="55" />
                  <circle
                    className={`circle-progress ${getRatingColorClass(emailScanResult.rating)}`}
                    cx="70"
                    cy="70"
                    r="55"
                    strokeDasharray={2 * Math.PI * 55}
                    strokeDashoffset={emailStrokeDashoffset}
                  />
                </svg>
                <div className="score-text-wrapper">
                  <span className="score-num">{emailScanResult.score}</span>
                  <span className="score-label">Trust</span>
                </div>
              </div>

              <div className={`rating-badge ${getRatingColorClass(emailScanResult.rating)}`}>
                {emailScanResult.rating}
              </div>

              <div className="email-result-meta">
                <p>
                  <strong>From:</strong> {emailScanResult.from}
                </p>
                <p>
                  <strong>Subject:</strong> {emailScanResult.subject}
                </p>
                <p>
                  <strong>Date:</strong> {emailScanResult.date}
                </p>
              </div>
            </div>

            <div className="result-details">
              <div className="protocol-pills">
                <div className={`protocol-pill ${emailScanResult.spfStatus.toLowerCase()}`}>
                  <span className="dot"></span>
                  <span>SPF: {emailScanResult.spfStatus}</span>
                </div>
                <div className={`protocol-pill ${emailScanResult.dkimStatus.toLowerCase()}`}>
                  <span className="dot"></span>
                  <span>DKIM: {emailScanResult.dkimStatus}</span>
                </div>
                <div className={`protocol-pill ${emailScanResult.dmarcStatus.toLowerCase()}`}>
                  <span className="dot"></span>
                  <span>DMARC: {emailScanResult.dmarcStatus}</span>
                </div>
              </div>

              {emailScanResult.fromDomain && (
                <div className="email-domain-check">
                  <div className="domain-row">
                    <span>Claimed Domain:</span>
                    <strong className="blue">{emailScanResult.fromDomain}</strong>
                  </div>
                  <div className="domain-row">
                    <span>Envelope Origin:</span>
                    <strong>{emailScanResult.returnPathDomain || "Unknown"}</strong>
                  </div>
                </div>
              )}

              {emailScanResult.warnings.length > 0 && (
                <div>
                  <h3 className="detail-section-title">⚠️ Threat Factors ({emailScanResult.warnings.length})</h3>
                  <div className="warning-list">
                    {emailScanResult.warnings.map((warning, idx) => (
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

              {emailScanResult.safeIndicators.length > 0 && (
                <div>
                  <h3 className="detail-section-title">
                    <span className="safe-icon">✓</span> Security Controls Passed
                  </h3>
                  <div className="safe-list">
                    {emailScanResult.safeIndicators.map((indicator, index) => (
                      <div key={index} className="safe-item">
                        <span className="safe-icon">✓</span>
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card result-placeholder">
            <div className="shield-check-icon">📧</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "750",
                color: "var(--text-secondary)",
                marginBottom: "8px",
              }}
            >
              Awaiting Headers
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "260px" }}>
              Paste raw email headers and click Scan to check SPF, DKIM & DMARC authentication.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
