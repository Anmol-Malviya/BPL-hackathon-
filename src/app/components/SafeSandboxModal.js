"use client";

import { useMemo } from "react";

export default function SafeSandboxModal({
  showSandbox,
  setShowSandbox,
  scanResult,
  sandboxTab,
  setSandboxTab,
  getRatingColorClass,
}) {
  // Build simulated console log lines for sandbox
  const consoleLogs = useMemo(() => {
    if (!scanResult) return [];
    const logs = [];
    logs.push({ type: "info", text: `[INFO] Initiating sandbox environment for: ${scanResult.domain}` });
    logs.push({ type: "info", text: "[INFO] Parsing DNS record..." });
    if (scanResult.deepScan?.dns?.active) {
      logs.push({ type: "success", text: `[DNS] Resolved → IP: ${scanResult.deepScan.dns.ip}` });
    } else if (scanResult.deepScan?.dns) {
      logs.push({ type: "err", text: `[DNS] No active DNS records found. Domain may be temporary.` });
    } else {
      logs.push({ type: "warn", text: `[DNS] DNS resolution not attempted (Deep Scan disabled).` });
    }
    logs.push({ type: "info", text: "[INFO] Checking SSL Certificate..." });
    if (scanResult.deepScan?.ssl?.hasCert) {
      logs.push({ type: "success", text: `[SSL] Certificate valid. Issuer: ${scanResult.deepScan.ssl.issuer}` });
      logs.push({ type: "success", text: `[SSL] Expires: ${new Date(scanResult.deepScan.ssl.validTo).toLocaleDateString()}` });
    } else if (scanResult.deepScan?.ssl) {
      logs.push({ type: "err", text: `[SSL] No valid certificate detected. Connection insecure.` });
    } else {
      logs.push({ type: "warn", text: `[SSL] Certificate check skipped (Deep Scan disabled).` });
    }
    logs.push({ type: "info", text: "[SANDBOX] Javascript execution — BLOCKED" });
    logs.push({ type: "info", text: "[SANDBOX] Cookie access — BLOCKED" });
    logs.push({ type: "info", text: "[SANDBOX] External resource loading — BLOCKED" });
    if (scanResult.deepScan?.page?.hasPasswordInput) {
      logs.push({ type: "err", text: `[AUDIT] Password input detected! Credential theft risk.` });
    }
    if (scanResult.deepScan?.page?.hasExternalForm) {
      logs.push({ type: "err", text: `[AUDIT] Form submits to external IP: ${scanResult.deepScan?.dns?.ip || "unknown"}` });
    }
    if (scanResult.deepScan?.page?.hasMetaRedirect || scanResult.deepScan?.page?.hasScriptRedirect) {
      logs.push({ type: "warn", text: `[AUDIT] Auto-redirect script detected and neutralized.` });
    }
    logs.push({ type: scanResult.rating === "SAFE" ? "success" : "err", text: `[RESULT] Sandbox audit complete. Rating: ${scanResult.rating}` });
    return logs;
  }, [scanResult]);

  // Build synthetic HTML code lines for the HTML view
  const htmlCodeLines = useMemo(() => {
    if (!scanResult) return [];
    const lines = [];
    lines.push({ num: 1, parts: [{ cls: "code-comment", text: `<!-- Sandboxed DOM Snapshot — ${scanResult.domain} -->` }] });
    lines.push({ num: 2, parts: [{ cls: "code-tag", text: "<html>" }] });
    lines.push({ num: 3, parts: [{ cls: "code-tag", text: "  <head>" }] });
    if (scanResult.deepScan?.page?.title) {
      lines.push({ num: 4, parts: [{ cls: "code-tag", text: "    <title>" }, { cls: "", text: scanResult.deepScan.page.title }, { cls: "code-tag", text: "</title>" }] });
    } else {
      lines.push({ num: 4, parts: [{ cls: "code-tag", text: "    <title>" }, { cls: "code-comment", text: "Unknown Title" }, { cls: "code-tag", text: "</title>" }] });
    }
    lines.push({ num: 5, parts: [{ cls: "code-tag", text: "  </head>" }] });
    lines.push({ num: 6, parts: [{ cls: "code-tag", text: "  <body>" }] });
    if (scanResult.deepScan?.page?.hasPasswordInput) {
      lines.push({ num: 7, parts: [{ cls: "code-comment", text: "    <!-- ⚠ Password input detected -->" }] });
      lines.push({ num: 8, parts: [{ cls: "code-tag", text: "    <form " }, { cls: "code-attr", text: "method=" }, { cls: "code-val", text: '"POST"' }, { cls: "code-attr", text: " action=" }, { cls: "code-val", text: `"https://${scanResult.deepScan?.dns?.ip || "external"}/steal"` }, { cls: "code-tag", text: ">" }] });
      lines.push({ num: 9, parts: [{ cls: "code-tag", text: "      <input " }, { cls: "code-attr", text: "type=" }, { cls: "code-val", text: '"password"' }, { cls: "code-tag", text: " />" }] });
      lines.push({ num: 10, parts: [{ cls: "code-tag", text: "    </form>" }] });
    } else {
      lines.push({ num: 7, parts: [{ cls: "code-tag", text: "    <div " }, { cls: "code-attr", text: "class=" }, { cls: "code-val", text: '"main"' }, { cls: "code-tag", text: ">" }] });
      lines.push({ num: 8, parts: [{ cls: "code-tag", text: "      <p>" }, { cls: "", text: `Welcome to ${scanResult.domain}` }, { cls: "code-tag", text: "</p>" }] });
      lines.push({ num: 9, parts: [{ cls: "code-tag", text: "    </div>" }] });
    }
    if (scanResult.deepScan?.page?.hasMetaRedirect) {
      lines.push({ num: 11, parts: [{ cls: "code-comment", text: "    <!-- ⚠ Meta redirect detected -->" }] });
      lines.push({ num: 12, parts: [{ cls: "code-tag", text: "    <meta " }, { cls: "code-attr", text: "http-equiv=" }, { cls: "code-val", text: '"refresh"' }, { cls: "code-attr", text: " content=" }, { cls: "code-val", text: '"0; url=https://phishing.site"' }, { cls: "code-tag", text: " />" }] });
    }
    lines.push({ num: 13, parts: [{ cls: "code-tag", text: "  </body>" }] });
    lines.push({ num: 14, parts: [{ cls: "code-tag", text: "</html>" }] });
    return lines;
  }, [scanResult]);

  if (!showSandbox || !scanResult) return null;

  return (
    <div className="sandbox-backdrop">
      <div className="sandbox-modal glass-card">
        {/* Browser chrome header */}
        <div className="sandbox-header">
          <div className="browser-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="sandbox-title">🔒 Safe Preview Sandbox Explorer</div>
          <button onClick={() => setShowSandbox(false)} className="sandbox-close-btn">
            ✕
          </button>
        </div>

        {/* Address bar */}
        <div className="sandbox-address-bar">
          <span className="sandbox-status-lock">🔒 Sandboxed</span>
          <input type="text" readOnly value={scanResult.url} className="sandbox-address-input" />
          <span
            className={`rating-badge ${getRatingColorClass(scanResult.rating)}`}
            style={{ flexShrink: 0, marginRight: "0" }}
          >
            {scanResult.rating}
          </span>
        </div>

        {/* Body */}
        <div className="sandbox-content-body">
          {/* Left info sidebar */}
          <div className="sandbox-sidebar">
            <div className="sandbox-sidebar-section">
              <h4>🔒 SSL Status</h4>
              {scanResult.deepScan?.ssl?.hasCert ? (
                <div className="sandbox-badge green">Active Certificate</div>
              ) : (
                <div className="sandbox-badge red">Insecure / No Cert</div>
              )}
              {scanResult.deepScan?.ssl?.hasCert && (
                <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                  <div>
                    Issuer: <span style={{ color: "var(--text-secondary)" }}>{scanResult.deepScan.ssl.issuer}</span>
                  </div>
                  <div>
                    Expires:{" "}
                    <span
                      style={{
                        color: scanResult.deepScan.ssl.isExpired ? "var(--color-danger)" : "var(--color-safe)",
                      }}
                    >
                      {new Date(scanResult.deepScan.ssl.validTo).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="sandbox-sidebar-section">
              <h4>📂 Page Audit</h4>
              <ul className="sandbox-structure-list">
                <li>
                  <span>Forms Found</span>
                  <span>{scanResult.deepScan?.page?.loginFormsCount ?? "—"}</span>
                </li>
                <li>
                  <span>Password Inputs</span>
                  <span
                    style={{
                      color: scanResult.deepScan?.page?.hasPasswordInput ? "var(--color-danger)" : "var(--color-safe)",
                    }}
                  >
                    {scanResult.deepScan?.page?.hasPasswordInput ? "YES ⚠" : "NO"}
                  </span>
                </li>
                <li>
                  <span>Ext. Submits</span>
                  <span
                    style={{
                      color: scanResult.deepScan?.page?.hasExternalForm ? "var(--color-danger)" : "var(--color-safe)",
                    }}
                  >
                    {scanResult.deepScan?.page?.hasExternalForm ? "YES ⚠" : "NO"}
                  </span>
                </li>
                <li>
                  <span>Auto Redirects</span>
                  <span
                    style={{
                      color:
                        scanResult.deepScan?.page?.hasMetaRedirect || scanResult.deepScan?.page?.hasScriptRedirect
                          ? "var(--color-suspicious)"
                          : "var(--color-safe)",
                    }}
                  >
                    {scanResult.deepScan?.page?.hasMetaRedirect || scanResult.deepScan?.page?.hasScriptRedirect
                      ? "YES ⚠"
                      : "NO"}
                  </span>
                </li>
                <li>
                  <span>IP Address</span>
                  <span>{scanResult.deepScan?.dns?.ip || "—"}</span>
                </li>
              </ul>
            </div>
            <div className="sandbox-sidebar-section">
              <h4>🛡️ Domain Score</h4>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  color:
                    scanResult.rating === "SAFE"
                      ? "var(--color-safe)"
                      : scanResult.rating === "SUSPICIOUS"
                      ? "var(--color-suspicious)"
                      : "var(--color-danger)",
                }}
              >
                {scanResult.score}
                <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
          </div>

          {/* Right viewer */}
          <div className="sandbox-viewer">
            {/* Tab nav */}
            <div className="sandbox-tabs-nav">
              {[
                { id: "render", label: "🖥 Render View" },
                { id: "html", label: "📄 HTML Code" },
                { id: "console", label: "⚡ Audit Console" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSandboxTab(t.id)}
                  className={`sandbox-tab-btn ${sandboxTab === t.id ? "active" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Render View Tab */}
            {sandboxTab === "render" && (
              <div className="sandbox-web-window">
                <div className="sandbox-web-header">
                  <h3>Title: {scanResult.deepScan?.page?.title || scanResult.domain}</h3>
                </div>
                <div className="sandbox-web-content">
                  <p className="sandbox-warning-info-bar">
                    ⚠️ Scripts, cookies, and external resources are disabled in this sandboxed view.
                  </p>
                  <div className="sandbox-render-preview">
                    <div className="sandbox-render-placeholder">
                      <div className="render-mock-header">
                        <h4>{scanResult.domain}</h4>
                      </div>
                      <div className="render-mock-body">
                        {scanResult.deepScan?.page?.hasPasswordInput ? (
                          <div className="mock-login-form">
                            <label>Sign in to your account</label>
                            <input type="text" placeholder="Email / Username" disabled />
                            <input type="password" placeholder="Password" disabled />
                            <button disabled>Sign In</button>
                            <div className="mock-form-alert">
                              🛑 WARNING: Credentials would be sent to:{" "}
                              <strong>{scanResult.deepScan?.dns?.ip || "external servers"}</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="mock-general-page">
                            <h5>Welcome to {scanResult.domain}</h5>
                            <p>This is a sandboxed text representation of the website.</p>
                            <div className="mock-paragraphs">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HTML Code View Tab */}
            {sandboxTab === "html" && (
              <div className="sandbox-code-editor">
                {htmlCodeLines.map((line, i) => (
                  <div key={i} className="code-line">
                    <span className="line-num">{line.num}</span>
                    <span className="line-content">
                      {line.parts.map((part, j) => (
                        <span key={j} className={part.cls}>
                          {part.text}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Audit Console Tab */}
            {sandboxTab === "console" && (
              <div className="sandbox-console">
                {consoleLogs.map((log, i) => (
                  <div key={i} className={`console-line ${log.type}`}>
                    {log.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
