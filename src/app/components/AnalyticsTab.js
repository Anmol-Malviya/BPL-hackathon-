"use client";

import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  RadialBarChart, 
  RadialBar 
} from "recharts";
import { ShieldCheck, BarChart3, TrendingUp, Cpu, Globe } from "lucide-react";

export default function AnalyticsTab({ scanHistory }) {
  // Chart Colors based on brand guidelines
  const COLORS = {
    primary: "#2563EB",     // Royal Blue
    navy: "#0B1F3A",        // Deep Navy
    accent: "#06B6D4",      // Cyan
    safe: "#16A34A",        // Safe (Green)
    warning: "#D97706",     // Warning (Orange)
    danger: "#DC2626",      // Danger (Red)
    neutral: "#64748B",     // Muted text gray
    lightBg: "#F8FAFC"
  };

  // Mock static data for Trends (7 Days)
  const trendsData = [
    { day: "Mon", Scans: 120, Threats: 8 },
    { day: "Tue", Scans: 150, Threats: 12 },
    { day: "Wed", Scans: 180, Threats: 15 },
    { day: "Thu", Scans: 140, Threats: 9 },
    { day: "Fri", Scans: 210, Threats: 25 },
    { day: "Sat", Scans: 90, Threats: 4 },
    { day: "Sun", Scans: 110, Threats: 6 }
  ];

  // Mock static data for Threat Categories
  const categoryData = [
    { name: "Brand Spoofing", value: 45, color: COLORS.danger },
    { name: "Typosquatting", value: 30, color: COLORS.warning },
    { name: "Insecure (HTTP)", value: 15, color: COLORS.primary },
    { name: "IDN Homographs", value: 10, color: COLORS.accent }
  ];

  // Mock static data for Country Distribution
  const countryData = [
    { country: "United States", count: 850, percentage: 42 },
    { country: "Russia", count: 480, percentage: 24 },
    { country: "China", count: 320, percentage: 16 },
    { country: "Germany", count: 200, percentage: 10 },
    { country: "Netherlands", count: 150, percentage: 8 }
  ];

  // Mock static data for Targeted Brands
  const brandData = [
    { name: "PayPal", value: 240 },
    { name: "Chase Bank", value: 180 },
    { name: "Microsoft", value: 150 },
    { name: "Google", value: 120 },
    { name: "MetaMask", value: 90 }
  ];

  // Mock data for AI Confidence radial chart
  const radialData = [
    { name: "Precision", value: 99.4, fill: COLORS.safe },
    { name: "Recall", value: 98.7, fill: COLORS.primary },
    { name: "F1 Score", value: 99.1, fill: COLORS.accent }
  ];

  return (
    <div className="space-y-6">
      
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Threat Intelligence Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Aggregated statistics, neural network precision levels, and attack vectors distribution.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <BarChart3 className="h-4 w-4 text-primary" />
          Model Metrics: Synced
        </div>
      </div>

      {/* Row 1: Weekly Scan Trends & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Scan Trends (Area Chart) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Weekly Diagnostic Volumes</h3>
              <p className="text-xs text-text-secondary mt-0.5">Scans executed vs phishing links intercepted</p>
            </div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +15.4% scans
            </span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke={COLORS.neutral} fontSize={10} tickLine={false} />
                <YAxis stroke={COLORS.neutral} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid #E5E7EB" }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Area type="monotone" dataKey="Scans" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" name="Total Scans Checked" />
                <Area type="monotone" dataKey="Threats" stroke={COLORS.danger} strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" name="Threats Intercepted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Categories (Pie Chart) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-navy">Threat Distributions</h3>
            <p className="text-xs text-text-secondary mt-0.5">Classification profiles of intercepted alerts</p>
          </div>
          
          <div className="h-[180px] my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            {categoryData.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-text-secondary font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-navy">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Attack Sources & Targeted Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Country distribution (Horizontal Bar Chart) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-heading font-bold text-sm text-navy">Geographical Threat Vectors</h3>
            <p className="text-xs text-text-secondary mt-0.5">Primary host server networks originating threats</p>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke={COLORS.neutral} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="country" type="category" stroke={COLORS.neutral} fontSize={10} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                <Bar dataKey="count" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={10} name="Total URLs Hosted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Targeted Brands (Vertical Bar Chart) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-heading font-bold text-sm text-navy">Most Targeted Brands</h3>
            <p className="text-xs text-text-secondary mt-0.5">Corporate identities spoofed in phishing payloads</p>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke={COLORS.neutral} fontSize={10} tickLine={false} />
                <YAxis stroke={COLORS.neutral} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={20} name="Intercepted Spoofs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Accuracy metrics & AI precision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Radial Accuracy Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">AI Classifier Accuracy</h3>
              <p className="text-xs text-text-secondary mt-0.5">Model evaluations against Kaggle phishing validation sets.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600"></span>
                <span className="text-text-secondary">Precision: 99.4%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span className="text-text-secondary">Recall Ratio: 98.7%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
                <span className="text-text-secondary">F1 Harmonic: 99.1%</span>
              </div>
            </div>
          </div>

          <div className="h-[140px] w-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={8} data={radialData}>
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence metric score description card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-navy">Neural Weightings Synced</h3>
              <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider mt-0.5">Logistic Classifier Model</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            The on-device model reads 25 attributes to generate standardized safety confidence scores. The model coefficients are calibrated daily against new threats.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>Model weights signature:</span>
            <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px]">sha256:c18b76...</span>
          </div>
        </div>

      </div>

    </div>
  );
}
