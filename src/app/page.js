"use client";

import { useState } from "react";
import { 
  Shield, 
  ArrowRight, 
  Terminal, 
  Activity, 
  Cpu, 
  Globe, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  ChevronDown, 
  Layers, 
  Zap, 
  ShieldCheck, 
  UserCheck,
  Smartphone,
  Download,
  Star,
  Wifi,
  BellRing,
  ScanLine,
  Menu,
  X
} from "lucide-react";
import { analyzeURL } from "../lib/phishingEngine";

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    // Simulate scanning delay for visual premium effect
    setTimeout(() => {
      const result = analyzeURL(urlInput);
      setScanResult(result);
      setIsScanning(false);
    }, 1500);
  };

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary/20 selection:text-primary">
      {/* ====== HEADER / NAVBAR ====== */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-primary shadow-md shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-navy">PhishShield AI</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Enterprise</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-navy transition-colors">Features</a>
            <a href="#showcase" className="text-sm font-medium text-text-secondary hover:text-navy transition-colors">AI Engine</a>
            <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-navy transition-colors">FAQ</a>
            <a href="#download" className="text-sm font-medium text-text-secondary hover:text-navy transition-colors">Download</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a 
              href="/system" 
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              <Terminal className="h-4 w-4" />
              Console Dashboard
            </a>
            <a 
              href="/system" 
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:bg-primary-hover transition-all duration-200"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-navy hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md shadow-lg transition-all">
            <div className="px-4 py-6 space-y-4">
              <nav className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-text-secondary hover:text-navy transition-colors py-2 border-b border-slate-50"
                >
                  Features
                </a>
                <a 
                  href="#showcase" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-text-secondary hover:text-navy transition-colors py-2 border-b border-slate-50"
                >
                  AI Engine
                </a>
                <a 
                  href="#faq" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-text-secondary hover:text-navy transition-colors py-2 border-b border-slate-50"
                >
                  FAQ
                </a>
                <a 
                  href="#download" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-text-secondary hover:text-navy transition-colors py-2"
                >
                  Download
                </a>
              </nav>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                <a 
                  href="/system" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy shadow-sm hover:bg-slate-50 transition-all duration-200"
                >
                  <Terminal className="h-4 w-4" />
                  Console Dashboard
                </a>
                <a 
                  href="/system" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:bg-primary-hover transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====== HERO SECTION ====== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-bg-primary py-20 lg:py-28">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
              <div className="inline-flex items-center justify-center lg:justify-start gap-1.5 self-center lg:self-start rounded-full bg-navy/5 px-3.5 py-1 text-xs font-semibold text-navy mb-5 border border-navy/10">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Next-Gen Zero-Day Threat Shield
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-none">
                AI-Powered <span className="text-primary">Phishing</span> & Email Defense
              </h1>
              <p className="mt-4 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Protect your enterprise from credential harvesting, social engineering, and malicious QR routing. Analyze links instantly using our lightweight machine learning engine and secure isolated sandboxing.
              </p>

              {/* URL Scanner Widget in Hero */}
              <div className="mt-8 max-w-xl mx-auto lg:mx-0 w-full">
                <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-2 shadow-xl border border-slate-100">
                  <div className="relative flex-grow flex items-center pl-3">
                    <Globe className="h-5 w-5 text-text-muted absolute left-3" />
                    <input
                      type="text"
                      placeholder="Paste suspicious URL (e.g., secure-chase-update.com)..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-transparent py-3 pl-8 pr-3 text-sm outline-none placeholder:text-text-muted text-text-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScanning || !urlInput.trim()}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isScanning ? "Scanning..." : "Analyze URL"}
                  </button>
                </form>

                {/* Scan Results Showcase */}
                {isScanning && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 animate-pulse flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    <span className="text-xs font-semibold text-blue-700">AI Threat Engine inspecting domain parameters, certificates, and SSL status...</span>
                  </div>
                )}

                {scanResult && !isScanning && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Analyzed URL Target</span>
                        <h4 className="text-sm font-semibold text-navy truncate max-w-[280px] sm:max-w-md">{scanResult.url}</h4>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        scanResult.rating === "SAFE" ? "bg-green-50 text-green-700 border border-green-200" :
                        scanResult.rating === "SUSPICIOUS" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {scanResult.rating === "SAFE" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {scanResult.rating}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[10px] text-text-muted block">AI Confidence Score</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-sm font-bold text-navy">{scanResult.score}% Safety</span>
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${scanResult.score}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block">Heuristics Audit</span>
                        <span className="text-xs font-semibold text-text-secondary mt-0.5 block">
                          {scanResult.warnings.length === 0 ? "0 Risk Indicators flag" : `${scanResult.warnings.length} Risk Flags caught`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      <a href="/system" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
                        Open Deep Analysis Console
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Hero Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative flex h-[340px] w-[340px] items-center justify-center sm:h-[400px] sm:w-[400px] rounded-full border border-slate-200/60 bg-white/30 backdrop-blur-3xl shadow-inner">
                {/* Pulse Rings */}
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-ring"></div>
                <div className="absolute inset-8 rounded-full border border-slate-200/80 animate-pulse-ring" style={{ animationDelay: "1s" }}></div>

                {/* Sweeping Radar Bar */}
                <div className="absolute inset-4 rounded-full border border-slate-100 bg-gradient-to-tr from-slate-50/10 to-primary/5">
                  <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-primary to-transparent origin-bottom animate-radar-sweep"></div>
                </div>

                {/* Core Shield Badge */}
                <div className="z-10 flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-navy to-navy-dark shadow-2xl">
                  <Shield className="h-16 w-16 text-white stroke-[1.25]" />
                  <div className="absolute flex h-20 w-20 items-center justify-center animate-ping opacity-15 bg-primary rounded-full"></div>
                </div>

                {/* Sub floating items */}
                <div className="absolute top-10 left-10 rounded-xl bg-white p-3 shadow-md border border-slate-100 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" />
                  <span className="text-[10px] font-bold text-navy">AI: 99.4% Acc</span>
                </div>

                <div className="absolute bottom-12 right-6 rounded-xl bg-white p-3 shadow-md border border-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-[10px] font-bold text-navy">Live Guard</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====== TRUSTED BY COMPANYS ====== */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center font-heading text-xs font-bold tracking-wider text-text-muted uppercase mb-6">
            TRUSTED BY CORPORATE ENTERPRISES WORLDWIDE
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-45 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-heading text-lg font-bold text-navy tracking-wider">MICROSOFT</span>
            <span className="font-heading text-lg font-bold text-navy tracking-wider">CLOUDFLARE</span>
            <span className="font-heading text-lg font-bold text-navy tracking-wider">CROWDSTRIKE</span>
            <span className="font-heading text-lg font-bold text-navy tracking-wider">CISCO SECURE</span>
            <span className="font-heading text-lg font-bold text-navy tracking-wider">GOOGLE SAFE</span>
          </div>
        </div>
      </section>

      {/* ====== PLATFORM STATISTICS ====== */}
      <section className="py-16 bg-bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Total Scans Audited", value: "2.4M+", desc: "Real-time threat assessments" },
              { label: "Active Enterprise Agents", value: "85K+", desc: "Endpoints fully secured" },
              { label: "Zero-Day Blocks", value: "99.4%", desc: "Industry-leading ML model" },
              { label: "Avg Execution Time", value: "180ms", desc: "No slowdown to productivity" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">{stat.label}</span>
                <span className="text-3xl font-extrabold text-navy mt-2 block">{stat.value}</span>
                <span className="text-xs text-text-secondary mt-1 block">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CORE FEATURES SECTION ====== */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full">Core Security Suite</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy mt-4">Enterprise-Grade Protection Capabilities</h2>
            <p className="text-text-secondary mt-2">Defend against complex, structured scams with our multi-layered detection technology.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Cpu className="h-6 w-6 text-primary" />,
                title: "On-Device ML Engine",
                desc: "Run high-fidelity Logistic Regression classifiers directly inside your browser or device. Analyzes structural URL attributes with zero network round-trip delays."
              },
              {
                icon: <Layers className="h-6 w-6 text-accent" />,
                title: "Typosquatting Safeguards",
                desc: "Intercept mimics of top brand domains instantly. Calculates Levenshtein edit distance and triggers alerts before credential abuse happens."
              },
              {
                icon: <Lock className="h-6 w-6 text-green-500" />,
                title: "Isolated Sandbox Preview",
                desc: "Launch suspicious URLs inside a secure render sandbox. Visualizes HTML previews without exposing credentials, session tokens, or local cookies."
              },
              {
                icon: <Mail className="h-6 w-6 text-indigo-500" />,
                title: "Header Auth Inspector",
                desc: "Examine SPF, DKIM, and DMARC alignment from raw email header text. Highlights inconsistencies between the mail envelope and visible sender addresses."
              },
              {
                icon: <Zap className="h-6 w-6 text-yellow-500" />,
                title: "QR Routing Safe-Scan",
                desc: "Deconstruct QR codes containing obfuscated, redirected, or tracking links. Displays the complete redirection chain before your device loads the page."
              },
              {
                icon: <Globe className="h-6 w-6 text-rose-500" />,
                title: "Threat Intel Integration",
                desc: "Correlate details against domain ages, WHOIS registration flags, name server status, and SSL expiration alerts to evaluate risk comprehensively."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white hover:shadow-lg transition-all duration-300 flex flex-col items-start text-left hover:-translate-y-1">
                <div className="p-3 bg-slate-50 rounded-xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-navy">{feature.title}</h3>
                <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ====== AI SHOWCASE SECTION ====== */}
      <section id="showcase" className="py-20 bg-bg-secondary/40 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Artificial Intelligence Showcase</span>
              <h2 className="font-heading text-3xl font-extrabold text-navy mt-3">How Our Feature-Extraction Engine Decodes Threats</h2>
              <p className="text-text-secondary mt-4 leading-relaxed">
                PhishShield AI dissects URLs into high-dimensional feature vectors. Rather than relying on simple, easily-bypassed blacklists, we evaluate entropy patterns, subdomain stack lengths, and visual character lookalikes (homographs).
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { title: "Entropy Calculations", desc: "Measures random character string distribution to capture algorithmically generated domains." },
                  { title: "Homograph Verification", desc: "Identifies Cyrillic or mixed-script characters mimicking classic English letters." },
                  { title: "Sensitive Word Density", desc: "Flags words denoting false urgency, secure logins, or account lockouts." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mt-1">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy text-sm">{item.title}</h4>
                      <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Visual Breakdown Block */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <span className="text-xs font-bold text-navy font-mono">MODEL DECISION BREAKDOWN</span>
                <span className="rounded bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">HIGH THREAT (92%)</span>
              </div>
              <div className="font-mono text-xs text-text-secondary bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100 overflow-x-auto select-all">
                <span className="text-slate-400">http://</span><span className="text-red-600 bg-red-50 font-bold">secure-paypal-verify</span><span className="text-slate-400">.</span><span className="text-amber-600 bg-amber-50 font-bold">fit</span><span className="text-slate-400">/signin</span>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Insecure Connection (HTTP)", score: "High Risk", impact: "+25%" },
                  { name: "Contains Brand Name 'paypal'", score: "Spoof Target", impact: "+50%" },
                  { name: "Urgency Key 'verify'", score: "Urgency Flag", impact: "+15%" },
                  { name: "Suspicious TLD '.fit'", score: "TLD Flag", impact: "+20%" }
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                    <span className="text-text-primary font-medium">{row.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted">{row.score}</span>
                      <span className="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{row.impact}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-navy text-white flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Final Verdict</span>
                  <h4 className="text-sm font-bold mt-0.5">Phishing Threat Suspended</h4>
                </div>
                <a href="/system" className="text-xs font-bold text-primary hover:text-white transition-colors flex items-center gap-0.5">
                  Launch Sandbox Sandbox
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CUSTOMER TESTIMONIALS ====== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">TESTIMONIALS</span>
          <h2 className="font-heading text-3xl font-extrabold text-navy mt-4 mb-16">Endorsed by Cyber Security Leaders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "PhishShield AI has completely simplified how we scan suspicious URLs. The isolated sandbox preview gives our IT helpdesk the perfect security envelope.",
                name: "Marcus Vance",
                role: "VP of Security Operations at CloudScale"
              },
              {
                quote: "The brand abuse and typosquatting detection metrics are extremely precise. It successfully catches Mixed-Script IDN homograph attempts that bypassed other gateways.",
                name: "Sarah Lindqvist",
                role: "Lead Security Researcher at Securitas Inc."
              },
              {
                quote: "Running lightweight machine learning features locally ensures we audit millions of customer notifications daily without adding execution lag to our backend.",
                name: "Devon Carter",
                role: "Director of Enterprise Infrastructure at PayNet"
              }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-2xl bg-bg-primary border border-slate-200/70 text-left flex flex-col justify-between shadow-sm">
                <p className="text-text-secondary text-sm italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-200/50 pt-4">
                  <div className="h-10 w-10 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy">{t.name}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FAQ SECTION ====== */}
      <section id="faq" className="py-20 bg-bg-secondary/40 border-t border-slate-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary tracking-wider uppercase">SUPPORT HUB</span>
            <h2 className="font-heading text-3xl font-extrabold text-navy mt-3">Frequently Answered Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the machine learning engine calculate risk scores?",
                a: "The engine uses a client-side Logistic Regression model trained on malicious domain parameters. It extracts 25 distinct statistical features—such as length variables, sensitive word density, Shannon Entropy, TLD reputation, and slash frequencies—to output a probability score."
              },
              {
                q: "What does the Deep Scan option verify?",
                a: "Deep Scan makes an active query to live APIs to test DNS status (MX/A records) and inspect the target site's SSL certificate details. It flags self-signed, expired, or missing certificates, as well as domains without active DNS hosting."
              },
              {
                q: "Is the isolated Safe Render Sandbox safe for testing malware links?",
                a: "Yes. The sandbox renders the suspicious URL's static HTML content inside an isolated container. It strips active scripting capabilities, cookies, and localStorage tokens, preventing session hijackers or cross-site scripting (XSS) payload executions from targeting your computer."
              },
              {
                q: "Can this scan email attachments for phishing?",
                a: "Our Email Header Inspector checks SPF, DKIM, and DMARC alignment records to identify sender spoofing. The console includes modules that extract and score embedded hyperlinks, and flag suspicious attachment MIME patterns."
              }
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="flex w-full items-center justify-between p-6 text-left font-semibold text-navy hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-300 ${faqOpen[i] ? "rotate-180" : ""}`} />
                </button>
                {faqOpen[i] && (
                  <div className="px-6 pb-6 text-sm text-text-secondary border-t border-slate-100 pt-4 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== APP DOWNLOAD SECTION ====== */}
      <section id="download" className="relative py-24 lg:py-28 overflow-hidden bg-white border-t border-slate-100">
        {/* Subtle accent blobs — consistent with hero/features pattern */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-24 w-[320px] h-[320px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header — mirrors Features & AI Showcase pattern */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/10 px-3 py-1 rounded-full">
              Mobile &amp; Desktop
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-navy mt-4">
              Carry PhishShield In Your Pocket
            </h2>
            <p className="text-text-secondary mt-3 leading-relaxed max-w-xl mx-auto">
              Scan QR codes, verify suspicious links, and protect your credentials — all offline, on your device. No cloud, no data sharing, full privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left — Store Badges + Stats */}
            <div className="lg:col-span-7 flex flex-col gap-8">

              {/* Download Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/app-debug.apk"
                  download="PhishShield.apk"
                  className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white shadow-xl shadow-primary/20 px-6 py-4.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 flex-grow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Download className="h-6 w-6 text-white animate-bounce" />
                  </div>
                  <div className="text-left min-w-0 flex-grow">
                    <span className="block text-[9px] text-white/80 font-bold tracking-widest uppercase">STABLE RELEASE</span>
                    <span className="block text-base font-extrabold text-white leading-tight">Download PhishShield APK</span>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-right text-xs text-white/70 font-semibold border-l border-white/15 pl-4 pr-1 flex-shrink-0">
                    <span>v1.0.0</span>
                    <span>6.9 MB</span>
                  </div>
                </a>
              </div>

              {/* Stats — mirrors Platform Statistics card style */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "Verified", label: "Safe APK", sub: "Clean & Signed" },
                  { value: "100%", label: "Offline Operation", sub: "No data logs" },
                  { value: "Free", label: "No Subscription", sub: "All features included" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-5 text-center shadow-sm">
                    <span className="text-xl font-extrabold text-navy block">{stat.value}</span>
                    <span className="text-xs font-semibold text-text-primary block mt-0.5">{stat.label}</span>
                    <span className="text-[10px] text-text-muted block mt-0.5">{stat.sub}</span>
                  </div>
                ))}
              </div>

              {/* Feature pills — lightweight tag list */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: <Lock className="h-3.5 w-3.5" />, text: "100% Offline Mode" },
                  { icon: <Shield className="h-3.5 w-3.5" />, text: "Zero Data Collection" },
                  { icon: <ScanLine className="h-3.5 w-3.5" />, text: "Instant QR Decode" },
                  { icon: <Zap className="h-3.5 w-3.5" />, text: "180ms Analysis" },
                ].map((pill, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-text-secondary">
                    <span className="text-primary">{pill.icon}</span>
                    {pill.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Subtle shadow bloom */}
                <div className="absolute inset-0 rounded-[3rem] bg-primary/8 blur-3xl scale-110 pointer-events-none" />

                {/* Phone frame */}
                <div
                  className="relative w-60 rounded-[3rem] bg-gradient-to-b from-slate-800 to-navy-dark border border-slate-700/40 shadow-2xl shadow-slate-900/20 overflow-hidden"
                  style={{ aspectRatio: '9/19' }}
                >
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl z-20" />

                  {/* Screen content */}
                  <div className="absolute inset-0 bg-gradient-to-b from-navy to-slate-900 p-3.5 pt-7 flex flex-col gap-2.5">
                    {/* App bar */}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                          <Shield className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-white text-[10px] font-bold tracking-wide">PhishShield</span>
                      </div>
                      <BellRing className="h-3.5 w-3.5 text-slate-400" />
                    </div>

                    {/* QR Scanner card */}
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ScanLine className="h-3 w-3 text-primary" />
                        <span className="text-white text-[9px] font-bold tracking-wide">Live QR Scanner</span>
                        <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      </div>
                      <div className="aspect-square rounded-xl bg-slate-800/80 border border-white/5 flex items-center justify-center">
                        <div className="relative w-14 h-14">
                          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary" />
                          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary" />
                          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary" />
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/70 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Result cards */}
                    <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      <div>
                        <span className="text-green-300 text-[9px] font-bold block leading-none">URL is Safe</span>
                        <span className="text-slate-400 text-[8px]">Score: 97% · 0 flags</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      <div>
                        <span className="text-red-300 text-[9px] font-bold block leading-none">Phishing Blocked</span>
                        <span className="text-slate-400 text-[8px]">secure-paypal.fit · High Risk</span>
                      </div>
                    </div>

                    {/* Bottom nav bar */}
                    <div className="mt-auto flex justify-around border-t border-white/5 pt-2">
                      {[Shield, Globe, ScanLine, Activity].map((Icon, i) => (
                        <div key={i} className={`p-1.5 rounded-lg ${i === 2 ? 'bg-primary' : 'bg-white/5'}`}>
                          <Icon className={`h-3 w-3 ${i === 2 ? 'text-white' : 'text-slate-500'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating notification badges — white cards matching hero style */}
                <div className="absolute -right-8 top-10 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-md flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-navy block leading-none">Threat Blocked</span>
                    <span className="text-[8px] text-text-muted">2ms · Offline</span>
                  </div>
                </div>

                <div className="absolute -left-10 bottom-16 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-md flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-navy block leading-none">Offline Ready</span>
                    <span className="text-[8px] text-text-muted">No internet needed</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-navy text-white border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-heading font-bold text-sm tracking-wide">PhishShield AI Portal</span>
          </div>
          <p className="text-xs text-slate-400 text-center md:text-left">
            Developed for Bhopal Hackathon 2026. Empowering businesses with advanced offline & online threat mitigation.
          </p>
          <p className="text-xs text-slate-500">
            © 2026 PhishShield AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
