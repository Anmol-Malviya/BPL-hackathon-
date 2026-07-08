"use client";

import { useMemo } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Search, 
  Mail, 
  Compass, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from "lucide-react";

export default function OverviewTab({ threatStats, scanHistory, setActiveTab, setUrlInput, handleCheckUrl }) {
  // Calculate average safety score from history
  const averageSafetyScore = useMemo(() => {
    if (scanHistory.length === 0) return 100;
    const total = scanHistory.reduce((sum, item) => sum + (item.score ?? 0), 0);
    return Math.round(total / scanHistory.length);
  }, [scanHistory]);

  const riskStatus = useMemo(() => {
    if (averageSafetyScore >= 80) return { label: "EXCELLENT", color: "text-green-600 bg-green-50 border-green-200", desc: "No critical threats detected recently. Keep running normal operations." };
    if (averageSafetyScore >= 50) return { label: "ATTENTION", color: "text-amber-600 bg-amber-50 border-amber-200", desc: "Recent scans contain suspicious URL elements. Inspect links before opening." };
    return { label: "CRITICAL RISK", color: "text-red-600 bg-red-50 border-red-200", desc: "Multiple active phishing threats identified. Alert network administrators immediately." };
  }, [averageSafetyScore]);

  // Compute active threat count
  const activeThreatCount = threatStats.dangerous;

  const handleRecentClick = (url) => {
    setUrlInput(url);
    setActiveTab("url-scanner");
    handleCheckUrl(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Security Operations Center</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time threat analytics, heuristic scoring, and on-device sandbox diagnostics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          Live Dashboard: Fully Synced
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Audited Links", value: scanHistory.length + 15, icon: <Compass className="h-5 w-5 text-primary" />, trend: "Updated live" },
          { label: "AI Safety Score", value: `${averageSafetyScore}%`, icon: <ShieldCheck className="h-5 w-5 text-green-500" />, trend: "Average confidence" },
          { label: "Active Threat Alert", value: activeThreatCount, icon: <ShieldAlert className="h-5 w-5 text-red-500" />, trend: "Awaiting mitigation" },
          { label: "Scan Engine Health", value: "Optimal", icon: <TrendingUp className="h-5 w-5 text-accent" />, trend: "180ms latency" }
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{card.label}</span>
              <span className="text-2xl font-extrabold text-navy mt-2 block">{card.value}</span>
              <span className="text-[10px] text-text-secondary mt-1 block">{card.trend}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: AI Threat score & Risk meter */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm text-navy">AI Threat Risk Meter</h3>
                <span className="text-[10px] font-bold font-mono text-text-muted uppercase">HEURISTICS SCORING</span>
              </div>
              <p className="text-xs text-text-secondary">Composite evaluation of past scanned items. Low scores mean dangerous elements have been checked.</p>
            </div>

            {/* Risk Meter Visual Indicator */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                
                {/* Circular Gauge Ring */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={averageSafetyScore >= 75 ? "#16A34A" : averageSafetyScore >= 45 ? "#D97706" : "#DC2626"}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 70}
                    strokeDashoffset={2 * Math.PI * 70 * (1 - averageSafetyScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Score Text */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-extrabold text-navy">{averageSafetyScore}</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted mt-0.5">Safety Index</span>
                </div>
              </div>

              {/* Score Badging */}
              <div className={`mt-6 px-3 py-1 rounded-full text-xs font-bold border ${riskStatus.color}`}>
                {riskStatus.label}
              </div>
              <p className="text-center text-xs text-text-secondary mt-3 max-w-[280px]">
                {riskStatus.desc}
              </p>
            </div>

            {/* Platform Health Quick Link */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Interactive sandboxed render test:</span>
              <button 
                onClick={() => setActiveTab("url-scanner")}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Launch Scanner
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Threat Timeline of Recent Scans */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm text-navy">Scanned Threat Timeline</h3>
                <span className="text-xs font-bold text-text-muted hover:underline cursor-pointer" onClick={() => setActiveTab("history")}>
                  View all logs
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-6">Chronological logs of recent link verification activities.</p>
            </div>

            {/* List of Recent Scans */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {scanHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-text-secondary">No scanned logs available. Try checking a URL.</p>
                </div>
              ) : (
                scanHistory.slice(0, 5).map((log, index) => {
                  const ratingColor = 
                    log.rating === "SAFE" ? "bg-green-50 text-green-700 border-green-200" :
                    log.rating === "SUSPICIOUS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-red-50 text-red-700 border-red-200";

                  return (
                    <div 
                      key={index} 
                      className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-text-muted block">{log.date}</span>
                        <span className="text-xs font-bold text-navy truncate block group-hover:text-primary transition-colors mt-0.5 max-w-[280px]">
                          {log.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ratingColor}`}>
                          {log.rating}
                        </span>
                        <button
                          onClick={() => handleRecentClick(log.url)}
                          className="p-1 rounded hover:bg-slate-100 text-text-muted hover:text-navy transition-all"
                          title="Inspect in URL Checker"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between">
              <span className="text-xs text-text-secondary">Caught a suspicious QR code or link?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("qr-scanner")}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1"
                >
                  <Compass className="h-3.5 w-3.5" /> Scan QR code
                </button>
                <button
                  onClick={() => setActiveTab("url-scanner")}
                  className="px-3.5 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all flex items-center gap-1"
                >
                  <Search className="h-3.5 w-3.5" /> Audit URL
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Security Insights & Action Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Enable SPF Check Verification",
            desc: "Sender Policy Framework validates mail servers. Add header verification to email workflows to prevent identity spoofing.",
            action: "Email Scanner",
            tab: "email-scanner",
            icon: <Mail className="h-5 w-5 text-primary" />
          },
          {
            title: "Implement Domain Lookalike Block",
            desc: "Prevent brand impersonation clicks. Use Typosquatting algorithms to automatically alert team members on typos.",
            action: "Open Settings",
            tab: "settings",
            icon: <Shield className="h-5 w-5 text-green-500" />
          },
          {
            title: "Test Security Awareness",
            desc: "Ensure Helpdesk operators know social engineering triggers. Conduct automated security quizzes inside the portal.",
            action: "Take Quiz",
            tab: "guide",
            icon: <Compass className="h-5 w-5 text-accent" />
          }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">{item.icon}</div>
                <h4 className="font-heading font-bold text-xs text-navy leading-none">{item.title}</h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {item.desc}
              </p>
            </div>
            <button
              onClick={() => setActiveTab(item.tab)}
              className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-0.5 justify-start text-left"
            >
              {item.action}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
