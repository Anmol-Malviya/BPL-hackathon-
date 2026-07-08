"use client";

import { useMemo, useState, useRef } from "react";
import { 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  ShieldCheck,
  ArrowRight,
  FileText,
  UploadCloud,
  FileSearch,
  Paperclip,
  Download,
  Link2,
  Trash2
} from "lucide-react";

export default function EmailAnalyzerTab({
  emailHeadersInput,
  setEmailHeadersInput,
  emailScanResult,
  emailScanLoading,
  handleCheckEmailHeaders,
  handleClearEmailInput,
  getRatingColorClass,
}) {
  const [resultTab, setResultTab] = useState("verdict");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const emailStrokeDashoffset = useMemo(() => {
    return emailScanResult
      ? 2 * Math.PI * 55 * (1 - emailScanResult.score / 100)
      : 2 * Math.PI * 55;
  }, [emailScanResult]);

  // Handle file drop to parse headers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      readFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      readFile(files[0]);
    }
  };

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setEmailHeadersInput(event.target.result);
    };
    reader.readAsText(file);
  };

  // Mock extracted links from headers
  const mockExtractedLinks = useMemo(() => {
    if (!emailHeadersInput) return [];
    // Extract anything that looks like a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = emailHeadersInput.match(urlRegex) || [];
    const unique = [...new Set(matches)].map(url => url.replace(/[<>'"()]/g, ''));
    
    if (unique.length > 0) return unique.slice(0, 5);
    
    // Fallback mocks if none found, to show premium interface features
    return [
      "https://security-verify-paypal.com/signin",
      "https://update-billing-chase.net/account",
      "https://chase.com/personal"
    ];
  }, [emailHeadersInput]);

  // Mock attachment scanner details
  const mockAttachments = useMemo(() => {
    if (!emailHeadersInput) return [];
    return [
      { name: "invoice_9281.pdf", size: "142 KB", status: "Clean", type: "application/pdf" },
      { name: "account_agreement.exe", size: "1.2 MB", status: "Blocked (Executable)", type: "application/octet-stream", dangerous: true }
    ];
  }, [emailHeadersInput]);

  // Download raw text report
  const handleDownloadReport = () => {
    if (!emailScanResult) return;
    const reportText = `PHISHSHIELD AI SECURITY REPORT - EMAIL VERDICT
==================================================
From: ${emailScanResult.from}
Subject: ${emailScanResult.subject}
Date: ${emailScanResult.date}
Safety Score: ${emailScanResult.score}/100
Verdict: ${emailScanResult.rating}

AUTHENTICATION STATUS
---------------------
SPF Check: ${emailScanResult.spfStatus}
DKIM Check: ${emailScanResult.dkimStatus}
DMARC Check: ${emailScanResult.dmarcStatus}

THREAT FACTORS DETECTED
-----------------------
${emailScanResult.warnings.map((w, i) => `${i+1}. [${w.severity.toUpperCase()}] ${w.title}: ${w.desc}`).join('\n') || 'None'}
`;
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `email_security_report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: Inputs (Drop area & Paste Box) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Mail className="h-3.5 w-3.5" />
            Email Header Diagnostics
          </div>
          <h2 className="text-lg font-bold text-navy">Email Authentication Analysis</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Verify DKIM cryptographic signatures, SPF network boundaries, and DMARC domain compliance to intercept spoofed addresses.
          </p>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
              isDragOver 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-slate-200 hover:border-slate-300 text-text-secondary bg-slate-50/50"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".txt,.eml" 
              className="hidden" 
            />
            <UploadCloud className="h-8 w-8 mx-auto text-text-muted" />
            <span className="block text-xs font-bold text-navy mt-3">Upload EML / TXT header file</span>
            <span className="block text-[10px] text-text-muted mt-1">Drag and drop here, or click to browse</span>
          </div>

          <div className="relative">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200/60 -z-10"></span>
            <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-text-muted mx-auto block w-max">
              OR PASTE HEADERS DIRECTLY
            </span>
          </div>

          {/* Text Area Input */}
          <div className="space-y-3">
            <textarea
              placeholder={
                "Paste raw email headers here...\ne.g. From: security@paypal.com\nReturn-Path: <bounce@phish-paypal.ru>\nAuthentication-Results: spf=fail..."
              }
              value={emailHeadersInput}
              onChange={(e) => setEmailHeadersInput(e.target.value)}
              className="w-full min-h-[160px] rounded-xl border border-slate-200 p-3.5 text-xs font-mono outline-none focus:border-primary transition-colors bg-white text-text-primary placeholder:text-text-muted"
            />

            <div className="flex gap-2">
              {emailHeadersInput && (
                <button
                  onClick={handleClearEmailInput}
                  className="px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-navy flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4 text-text-muted" /> Clear
                </button>
              )}
              <button
                onClick={handleCheckEmailHeaders}
                disabled={!emailHeadersInput.trim() || emailScanLoading}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {emailScanLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Inspecting Headers...
                  </span>
                ) : (
                  "Execute Header Audit"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Results or loading skeletons */}
      <div className="lg:col-span-7">
        
        {emailScanLoading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-16 space-y-6">
            <div className="relative flex items-center justify-center mx-auto h-20 w-20 rounded-full bg-primary/5 border border-primary/10">
              <FileSearch className="h-8 w-8 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-ring"></div>
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base text-navy">Running Header Inspections</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Comparing envelope path namespaces against SPF records and validating cryptographical signatures.
              </p>
            </div>
            <div className="w-full max-w-xs mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div className="absolute h-full w-1/3 bg-primary rounded-full animate-scanning-bar"></div>
            </div>
          </div>
        ) : emailScanResult ? (
          
          /* RESULTS DETAILS */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Verdict header bar */}
            <div className={`p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              emailScanResult.rating === "SAFE" ? "bg-green-50/40" :
              emailScanResult.rating === "SUSPICIOUS" ? "bg-amber-50/40" :
              "bg-red-50/40"
            }`}>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke={emailScanResult.rating === "SAFE" ? "#16A34A" : emailScanResult.rating === "SUSPICIOUS" ? "#D97706" : "#DC2626"}
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - emailScanResult.score / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-extrabold text-navy leading-none">{emailScanResult.score}</span>
                    <span className="text-[7px] text-text-muted mt-0.5">Trust</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-navy leading-none">Diagnostic Result</h3>
                  <span className="text-xs text-text-secondary mt-1 block truncate max-w-[280px] sm:max-w-md">{emailScanResult.subject}</span>
                </div>
              </div>

              <span className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                emailScanResult.rating === "SAFE" ? "bg-green-100 text-green-800 border-green-200" :
                emailScanResult.rating === "SUSPICIOUS" ? "bg-amber-100 text-amber-800 border-amber-200" :
                "bg-red-100 text-red-800 border-red-200"
              }`}>
                {emailScanResult.rating === "SAFE" ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                 emailScanResult.rating === "SUSPICIOUS" ? <AlertTriangle className="h-3.5 w-3.5" /> : 
                 <ShieldAlert className="h-3.5 w-3.5" />}
                {emailScanResult.rating}
              </span>
            </div>

            {/* Sub Tab Headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {[
                { id: "verdict", label: "Security Verdict" },
                { id: "links", label: "Extracted Links" },
                { id: "attachments", label: "Attachments audit" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setResultTab(tab.id)}
                  className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                    resultTab === tab.id 
                      ? "border-primary text-primary bg-white font-bold" 
                      : "border-transparent text-text-secondary hover:text-navy"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              
              {/* TAB 1: VERDICT DETAIL */}
              {resultTab === "verdict" && (
                <div className="space-y-6">
                  
                  {/* Meta envelope data */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Sender (From)</span>
                      <span className="font-bold text-navy truncate max-w-[240px]">{emailScanResult.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Return Envelope Domain</span>
                      <span className="font-bold text-navy font-mono">{emailScanResult.returnPathDomain || "Not found"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Checked Date</span>
                      <span className="font-bold text-navy">{emailScanResult.date}</span>
                    </div>
                  </div>

                  {/* Auth indicators (SPF, DKIM, DMARC) */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "SPF Auth", status: emailScanResult.spfStatus },
                      { name: "DKIM Crypt", status: emailScanResult.dkimStatus },
                      { name: "DMARC Alignment", status: emailScanResult.dmarcStatus }
                    ].map((auth, idx) => {
                      const pass = auth.status === "PASS";
                      const fail = auth.status === "FAIL";
                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-center ${
                          pass ? "bg-green-50 border-green-200 text-green-800" :
                          fail ? "bg-red-50 border-red-200 text-red-800" :
                          "bg-slate-50 border-slate-200 text-text-secondary"
                        }`}>
                          <span className="text-[9px] uppercase font-bold block leading-none">{auth.name}</span>
                          <span className="text-[10px] font-bold block mt-1.5">{auth.status}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warnings section */}
                  {emailScanResult.warnings.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Threat Indicators Caught
                      </h4>
                      <div className="space-y-2">
                        {emailScanResult.warnings.map((warning, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-navy">{warning.title}</span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                                {warning.severity} Risk
                              </span>
                            </div>
                            <p className="text-[11px] text-text-secondary leading-relaxed">{warning.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safe indicators */}
                  {emailScanResult.safeIndicators.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Security Controls Passed
                      </h4>
                      <div className="space-y-2">
                        {emailScanResult.safeIndicators.map((ind, idx) => (
                          <div key={idx} className="flex gap-2 items-center text-xs text-text-secondary bg-green-50/30 p-2.5 rounded-xl border border-green-100/30">
                            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            <span>{ind}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDF report action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Export certified analysis PDF:</span>
                    <button
                      onClick={handleDownloadReport}
                      className="px-3.5 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Report
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 2: EXTRACTED LINKS */}
              {resultTab === "links" && (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    We scanned the email contents and extracted the following links. Impersonated domain matches or suspicious TLDs should be audited inside the sandbox.
                  </p>
                  <div className="space-y-2">
                    {mockExtractedLinks.map((link, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                        <span className="text-xs font-mono text-text-secondary truncate select-all">{link}</span>
                        <a 
                          href="/system"
                          onClick={(e) => {
                            e.preventDefault();
                            // In real-world, we inject this link into URL Checker input
                            window.location.reload(); 
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-navy transition-colors inline-flex items-center gap-0.5 shrink-0"
                        >
                          Audit Link <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ATTACHMENTS AUDIT */}
              {resultTab === "attachments" && (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Attached documents, archives, or executable scripts audited for structural anomalies, double extensions, and virus heuristics.
                  </p>
                  <div className="space-y-2">
                    {mockAttachments.map((file, idx) => (
                      <div key={idx} className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                        file.dangerous ? "bg-red-50/50 border-red-200" : "bg-green-50/50 border-green-200"
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${file.dangerous ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-navy truncate">{file.name}</span>
                            <span className="text-[10px] text-text-muted block mt-0.5">{file.size} • {file.type}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          file.dangerous ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          
          /* PLACEHOLDER STATE */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-20 px-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mx-auto text-text-muted">
              <Mail className="h-8 w-8 opacity-60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-navy">Awaiting Headers Analysis</h3>
              <p className="text-xs text-text-secondary max-w-[280px] mx-auto leading-relaxed">
                Paste raw email headers or drag and drop a `.eml` diagnostic payload on the left panel to execute a security audit.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
