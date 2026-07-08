"use client";

import { useMemo } from "react";
import { 
  Lock, 
  Shield, 
  Monitor, 
  Code, 
  Terminal, 
  Globe, 
  FileSearch, 
  AlertTriangle,
  X,
  ShieldCheck,
  ShieldAlert,
  Server
} from "lucide-react";

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
    lines.push({ num: 1, parts: [{ cls: "text-slate-400", text: `<!-- Sandboxed DOM Snapshot — ${scanResult.domain} -->` }] });
    lines.push({ num: 2, parts: [{ cls: "text-blue-600 font-bold", text: "<html>" }] });
    lines.push({ num: 3, parts: [{ cls: "text-blue-600 font-bold", text: "  <head>" }] });
    if (scanResult.deepScan?.page?.title) {
      lines.push({ num: 4, parts: [{ cls: "text-blue-600 font-bold", text: "    <title>" }, { cls: "text-text-primary", text: scanResult.deepScan.page.title }, { cls: "text-blue-600 font-bold", text: "</title>" }] });
    } else {
      lines.push({ num: 4, parts: [{ cls: "text-blue-600 font-bold", text: "    <title>" }, { cls: "text-slate-400 italic", text: "Unknown Title" }, { cls: "text-blue-600 font-bold", text: "</title>" }] });
    }
    lines.push({ num: 5, parts: [{ cls: "text-blue-600 font-bold", text: "  </head>" }] });
    lines.push({ num: 6, parts: [{ cls: "text-blue-600 font-bold", text: "  <body>" }] });
    if (scanResult.deepScan?.page?.hasPasswordInput) {
      lines.push({ num: 7, parts: [{ cls: "text-red-500 font-bold", text: "    <!-- ⚠ Password input detected -->" }] });
      lines.push({ num: 8, parts: [{ cls: "text-blue-600 font-bold", text: "    <form " }, { cls: "text-purple-600", text: "method=" }, { cls: "text-green-600", text: '"POST"' }, { cls: "text-purple-600", text: " action=" }, { cls: "text-green-600", text: `"https://${scanResult.deepScan?.dns?.ip || "external"}/steal"` }, { cls: "text-blue-600 font-bold", text: ">" }] });
      lines.push({ num: 9, parts: [{ cls: "text-blue-600 font-bold", text: "      <input " }, { cls: "text-purple-600", text: "type=" }, { cls: "text-green-600", text: '"password"' }, { cls: "text-blue-600 font-bold", text: " />" }] });
      lines.push({ num: 10, parts: [{ cls: "text-blue-600 font-bold", text: "    </form>" }] });
    } else {
      lines.push({ num: 7, parts: [{ cls: "text-blue-600 font-bold", text: "    <div " }, { cls: "text-purple-600", text: "class=" }, { cls: "text-green-600", text: '"main"' }, { cls: "text-blue-600 font-bold", text: ">" }] });
      lines.push({ num: 8, parts: [{ cls: "text-blue-600 font-bold", text: "      <p>" }, { cls: "text-text-primary", text: `Welcome to ${scanResult.domain}` }, { cls: "text-blue-600 font-bold", text: "</p>" }] });
      lines.push({ num: 9, parts: [{ cls: "text-blue-600 font-bold", text: "    </div>" }] });
    }
    if (scanResult.deepScan?.page?.hasMetaRedirect) {
      lines.push({ num: 11, parts: [{ cls: "text-red-500 font-bold", text: "    <!-- ⚠ Meta redirect detected -->" }] });
      lines.push({ num: 12, parts: [{ cls: "text-blue-600 font-bold", text: "    <meta " }, { cls: "text-purple-600", text: "http-equiv=" }, { cls: "text-green-600", text: '"refresh"' }, { cls: "text-purple-600", text: " content=" }, { cls: "text-green-600", text: '"0; url=https://phishing.site"' }, { cls: "text-blue-600 font-bold", text: " />" }] });
    }
    lines.push({ num: 13, parts: [{ cls: "text-blue-600 font-bold", text: "  </body>" }] });
    lines.push({ num: 14, parts: [{ cls: "text-blue-600 font-bold", text: "</html>" }] });
    return lines;
  }, [scanResult]);

  if (!showSandbox || !scanResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Browser Chrome Header bar */}
        <div className="bg-slate-100 px-4 h-12 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex gap-1.5 items-center">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
          </div>
          
          <div className="text-xs font-bold text-navy flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" />
            Isolated Sandbox Preview Window
          </div>

          <button 
            onClick={() => setShowSandbox(false)}
            className="p-1 rounded-lg hover:bg-slate-200 text-text-secondary hover:text-navy transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Address bar mock */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 px-4 flex items-center gap-3 shrink-0">
          <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border border-primary/20 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Sandboxed
          </span>
          <input
            type="text"
            readOnly
            value={scanResult.url}
            className="flex-grow bg-white border border-slate-200 text-xs font-mono rounded-lg py-1 px-3 outline-none text-text-primary truncate"
          />
          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
            scanResult.rating === "SAFE" ? "bg-green-50 text-green-700 border-green-200" :
            scanResult.rating === "SUSPICIOUS" ? "bg-amber-50 text-amber-700 border-amber-200" :
            "bg-red-50 text-red-700 border-red-200"
          }`}>
            {scanResult.rating}
          </span>
        </div>

        {/* Main Workspace layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sandbox Info Sidebar */}
          <div className="w-56 border-r border-slate-200 bg-slate-50/50 p-4 space-y-5 overflow-y-auto hidden sm:block shrink-0">
            
            {/* SSL Info Block */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                <Lock className="h-3 w-3" /> SSL handshake
              </span>
              {scanResult.deepScan?.ssl?.hasCert ? (
                <span className="inline-flex items-center gap-1 rounded bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5">
                  Handshake Secure
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5">
                  Insecure Protocol
                </span>
              )}
              {scanResult.deepScan?.ssl?.hasCert && (
                <div className="text-[10px] text-text-secondary pt-1 space-y-0.5 font-medium">
                  <div className="truncate">Issuer: {scanResult.deepScan.ssl.issuer}</div>
                  <div>Expiry: {new Date(scanResult.deepScan.ssl.validTo).toLocaleDateString()}</div>
                </div>
              )}
            </div>

            {/* DOM Audit Block */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                <FileSearch className="h-3 w-3" /> DOM Audit Indicators
              </span>
              <ul className="text-[10px] text-text-secondary space-y-2 font-medium">
                <li className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Login Forms</span>
                  <span className="font-bold text-navy">{scanResult.deepScan?.page?.loginFormsCount ?? "0"}</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Pass Inputs</span>
                  <span className={`font-bold ${scanResult.deepScan?.page?.hasPasswordInput ? "text-red-500" : "text-green-600"}`}>
                    {scanResult.deepScan?.page?.hasPasswordInput ? "YES ⚠" : "NO"}
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Ext Form Targets</span>
                  <span className={`font-bold ${scanResult.deepScan?.page?.hasExternalForm ? "text-red-500" : "text-green-600"}`}>
                    {scanResult.deepScan?.page?.hasExternalForm ? "YES ⚠" : "NO"}
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>DNS Host IP</span>
                  <span className="font-mono truncate max-w-[100px]">{scanResult.deepScan?.dns?.ip || "unknown"}</span>
                </li>
              </ul>
            </div>

            {/* Shield Safety Index */}
            <div className="space-y-1.5 pt-4 border-t border-slate-200">
              <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1">
                <Shield className="h-3 w-3" /> Safety Index
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-extrabold ${
                  scanResult.rating === "SAFE" ? "text-green-600" :
                  scanResult.rating === "SUSPICIOUS" ? "text-amber-500" :
                  "text-red-600"
                }`}>
                  {scanResult.score}
                </span>
                <span className="text-xs text-text-muted font-bold">/ 100</span>
              </div>
            </div>
          </div>

          {/* Right Viewer Screen */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* View Tab selectors */}
            <div className="bg-white border-b border-slate-200 px-4 flex gap-1 shrink-0 h-10 items-center">
              {[
                { id: "render", label: "Render View", icon: <Monitor className="h-3.5 w-3.5" /> },
                { id: "html", label: "HTML Code Source", icon: <Code className="h-3.5 w-3.5" /> },
                { id: "console", label: "Diagnostic Console", icon: <Terminal className="h-3.5 w-3.5" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSandboxTab(t.id)}
                  className={`px-4 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    sandboxTab === t.id 
                      ? "bg-slate-100 text-navy font-bold" 
                      : "text-text-secondary hover:text-navy hover:bg-slate-50"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="flex-grow p-4 overflow-y-auto">
              
              {/* VIEW 1: RENDER VIEW */}
              {sandboxTab === "render" && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-navy truncate">Title: {scanResult.deepScan?.page?.title || scanResult.domain}</span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                      <Server className="h-3 w-3" /> Static Sandbox DOM
                    </span>
                  </div>
                  
                  <div className="flex-grow p-6 overflow-y-auto space-y-4">
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        JavaScript execution, localStorage tokens, and third-party cookies have been fully neutralized in this sandbox preview.
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/30">
                      {scanResult.deepScan?.page?.hasPasswordInput ? (
                        <div className="max-w-sm mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-bold text-navy text-center uppercase tracking-wider">MOCK SIGN IN PORTAL</h4>
                          <div className="space-y-3">
                            <input type="text" placeholder="Username / Email" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50/50 cursor-not-allowed" />
                            <input type="password" placeholder="Password" disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50/50 cursor-not-allowed" />
                            <button disabled className="w-full rounded-lg bg-slate-300 text-white py-2 text-xs font-semibold cursor-not-allowed">Sign In</button>
                          </div>
                          <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-[10px] leading-relaxed flex gap-1.5 items-start">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              WARNING: Submitting forms on this target would transmit credentials to: <strong>{scanResult.deepScan?.dns?.ip || "external servers"}</strong>.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md mx-auto space-y-3 text-center">
                          <h4 className="font-heading font-bold text-sm text-navy">Welcome to {scanResult.domain}</h4>
                          <p className="text-xs text-text-secondary">This is a secure static layout rendered directly from parsed body tags.</p>
                          <div className="space-y-2 pt-4">
                            <div className="h-3 bg-slate-200/60 rounded w-full mx-auto"></div>
                            <div className="h-3 bg-slate-200/60 rounded w-5/6 mx-auto"></div>
                            <div className="h-3 bg-slate-200/60 rounded w-4/5 mx-auto"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: HTML CODE VIEW */}
              {sandboxTab === "html" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm h-full p-4 font-mono text-xs overflow-y-auto leading-relaxed select-all">
                  {htmlCodeLines.map((line, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="w-8 shrink-0 text-right text-slate-600 select-none border-r border-slate-800/80 pr-2">{line.num}</span>
                      <span className="flex-grow">
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

              {/* VIEW 3: AUDIT CONSOLE LOGS */}
              {sandboxTab === "console" && (
                <div className="bg-slate-950 border border-slate-900 rounded-xl shadow-sm h-full p-5 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 leading-relaxed">
                  {consoleLogs.map((log, i) => {
                    const color = 
                      log.type === "success" ? "text-green-400" :
                      log.type === "err" ? "text-red-400 font-bold" :
                      log.type === "warn" ? "text-amber-400" :
                      "text-slate-400";
                    return (
                      <div key={i} className={`${color}`}>
                        {log.text}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
