"use client";

import { useState } from "react";
import { 
  User, 
  Key, 
  Bell, 
  ShieldAlert, 
  Sliders, 
  Globe, 
  CreditCard,
  Copy,
  Check,
  RotateCw,
  Eye,
  EyeOff
} from "lucide-react";

export default function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState("profile");
  const [profileName, setProfileName] = useState("Anmol Malviya");
  const [profileEmail, setProfileEmail] = useState("anmol@phishshield.com");
  const [apiKey, setApiKey] = useState("ps_live_8F3a0dB2kL9s7Q6eP1mR5tW9uV4yX");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Generate new API Key
  const handleRegenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let newKey = "ps_live_";
    for (let i = 0; i < 28; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(newKey);
    setShowKey(true);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const subTabs = [
    { id: "profile", label: "Account Profile", icon: <User className="h-4 w-4" /> },
    { id: "api", label: "API Credentials", icon: <Key className="h-4 w-4" /> },
    { id: "notifications", label: "Alert Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "sandbox", label: "Sandbox Security", icon: <ShieldAlert className="h-4 w-4" /> },
    { id: "billing", label: "Billing & Plans", icon: <CreditCard className="h-4 w-4" /> }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
      
      {/* Settings Navigation Column */}
      <div className="w-full md:w-60 border-r border-slate-200 bg-slate-50/50 p-4 space-y-1">
        <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted px-4 block mb-3">SYSTEM PREFERENCES</span>
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                isActive 
                  ? "bg-navy text-white shadow-sm" 
                  : "text-text-secondary hover:text-navy hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Form Pane */}
      <div className="flex-1 p-6 sm:p-8">
        
        {/* SUBTAB 1: ACCOUNT PROFILE */}
        {activeSubTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Account Credentials</h3>
              <p className="text-xs text-text-secondary mt-0.5">Manage details for console access and team administration.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs outline-none focus:border-primary text-text-primary"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Work Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs outline-none focus:border-primary text-text-primary"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-text-secondary block mb-1.5">Operator Role</label>
                <input
                  type="text"
                  value="Lead Cybersecurity Operations Analyst"
                  disabled
                  className="w-full rounded-xl border border-slate-200/60 bg-slate-50 py-2.5 px-3 text-xs text-text-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
              >
                {isSaved ? "Saved Successfully" : "Update Profile"}
              </button>
            </div>
          </form>
        )}

        {/* SUBTAB 2: API CREDENTIALS */}
        {activeSubTab === "api" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">API Integrations Keys</h3>
              <p className="text-xs text-text-secondary mt-0.5">Integrate live ML checks into mail servers, slack chatbots, or firewalls.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <label className="text-[10px] uppercase font-bold text-text-secondary block leading-none">Security Webhook Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-xs font-mono text-text-primary outline-none"
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)} 
                      className="absolute right-3.5 text-text-muted hover:text-navy p-0.5 rounded"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-navy flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-blue-50/20 text-xs text-text-secondary leading-relaxed">
                <span>Webhook endpoint latency averages 45ms with 99.99% cloud uptime SLA.</span>
                <button
                  onClick={handleRegenerateKey}
                  className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-dark text-white text-[10px] font-bold flex items-center gap-1 shrink-0 ml-4 transition-colors"
                >
                  <RotateCw className="h-3 w-3" /> Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: THREAT NOTIFICATIONS */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Alert Protocols</h3>
              <p className="text-xs text-text-secondary mt-0.5">Control where and when threat warnings are broadcast.</p>
            </div>

            <div className="space-y-3.5">
              {[
                { title: "Critical Phishing Detections", desc: "Instantly alert administrators when high-severity mimics are detected.", checked: true },
                { title: "Weekly Security Reports", desc: "Receive summary charts showing weekly scans and intercept logs.", checked: true },
                { title: "Browser Desktop Push Notifications", desc: "Toggle live popup warning notifications during active scans.", checked: false },
                { title: "API Quota Limits", desc: "Get notifications when API key usage limits approach 80%.", checked: true }
              ].map((item, idx) => (
                <label key={idx} className="flex gap-3.5 items-start p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy block">{item.title}</span>
                    <span className="text-[10px] text-text-secondary mt-0.5 block leading-relaxed">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: SANDBOX SECURITY */}
        {activeSubTab === "sandbox" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Safe rendering configuration</h3>
              <p className="text-xs text-text-secondary mt-0.5">Configure isolate rule parameters inside the sandbox rendering modal.</p>
            </div>

            <div className="space-y-3.5">
              {[
                { title: "Disable JavaScript Execution", desc: "Strip all `<script>` components from html pages to block drive-by malware.", checked: true },
                { title: "Isolate Authentication Tokens", desc: "Clear cookies, session credentials, and local storage values.", checked: true },
                { title: "Emulate Mobile User-Agent", desc: "Bypass security scraping blocks by emulating standard iOS/Android devices.", checked: false },
                { title: "Pre-render HTML CSS Previews", desc: "Compile a static layout view instead of mounting dynamic React code.", checked: true }
              ].map((item, idx) => (
                <label key={idx} className="flex gap-3.5 items-start p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy block">{item.title}</span>
                    <span className="text-[10px] text-text-secondary mt-0.5 block leading-relaxed">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 5: BILLING & PLANS */}
        {activeSubTab === "billing" && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Billing & Operations Subscription</h3>
              <p className="text-xs text-text-secondary mt-0.5">Manage business plan packages, endpoints slots, and download invoices.</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-navy to-navy-dark text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">CURRENT TIER</span>
                <span className="text-lg font-extrabold block mt-2">Enterprise Plan Shield</span>
                <span className="text-[10px] text-slate-300 mt-1 block">Unlimited local scans • 100K API operations /mo</span>
              </div>
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-sm border border-primary/20 shrink-0">
                Active Plan
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between font-bold text-navy">
                <span>Verification Usage metrics</span>
                <span>4,120 / 100,000 links</span>
              </div>
              <div className="p-3 flex justify-between text-text-secondary">
                <span>Renewal Date</span>
                <span className="font-semibold text-navy">August 1, 2026</span>
              </div>
              <div className="p-3 border-t border-slate-100 flex justify-between text-text-secondary">
                <span>Billing Address</span>
                <span className="font-semibold text-navy">PHISHSHIELD CORP, San Francisco, CA</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
