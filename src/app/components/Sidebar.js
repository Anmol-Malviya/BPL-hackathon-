"use client";

import { Activity, Shield, ShieldCheck, Zap, WifiOff, User } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, threatStats, navItems, isOnline }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-navy text-white h-full border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-sm tracking-wide leading-none">PhishShield</span>
          <span className="text-[10px] text-primary font-semibold mt-0.5 uppercase tracking-wider">AI Operations</span>
        </div>
      </div>

      {/* Threat Radar Stats Panel */}
      <div className="p-4 mx-4 mt-6 bg-slate-900/60 rounded-2xl border border-slate-800/60">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Threat Radar
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/30">
            <span className="block text-sm font-bold text-green-500">{threatStats.safe}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Safe</span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/30">
            <span className="block text-sm font-bold text-amber-500">{threatStats.suspicious}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Warn</span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/30">
            <span className="block text-sm font-bold text-red-500">{threatStats.dangerous}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Threat</span>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <span className={`transition-colors duration-150 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Analyst Profile & Connection Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-xs font-bold leading-none">SecOps Analyst</span>
            <span className="text-[9px] text-slate-500 block mt-1">Level-2 Sandbox Access</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-green-400" : "bg-amber-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-green-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              {isOnline ? "Live Defense Active" : "Local Mode (Offline)"}
            </span>
          </div>
          {isOnline ? <Zap className="h-3 w-3 text-primary" /> : <WifiOff className="h-3 w-3 text-amber-500" />}
        </div>
      </div>
    </aside>
  );
}
