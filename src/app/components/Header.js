"use client";

import { useState } from "react";
import { Zap, WifiOff, Bell, Search, ShieldCheck } from "lucide-react";

export default function Header({ isOnline }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockAlerts = [
    { title: "Typosquat Intercepted", desc: "Detected fake paypal login target link.", time: "10m ago" },
    { title: "DKIM Signature Invalid", desc: "Forced reject on suspicious spf verify.", time: "1h ago" }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 relative z-30">
      
      {/* Left panel: Quick search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative w-full flex items-center">
          <Search className="h-4 w-4 text-text-muted absolute left-3" />
          <input
            type="text"
            placeholder="Search threats, links, or logs..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-1.5 pl-9 pr-3 text-xs outline-none focus:border-primary transition-colors text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Right panel: Alerts center & online stats */}
      <div className="flex items-center gap-4">
        {/* Status badges */}
        {isOnline ? (
          <span className="hidden sm:inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <Zap className="h-3 w-3" /> Live Shield Active
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <WifiOff className="h-3 w-3" /> Local Mode Offline
          </span>
        )}

        {/* Notifications center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-text-secondary hover:text-navy transition-colors relative"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-navy flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Active Threat Feeds
                </span>
                <span className="text-[10px] text-text-muted cursor-pointer hover:underline">Mark read</span>
              </div>
              <div className="space-y-2.5">
                {mockAlerts.map((alert, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors text-xs">
                    <div className="flex justify-between font-bold text-navy">
                      <span>{alert.title}</span>
                      <span className="text-[9px] text-text-muted font-normal">{alert.time}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">{alert.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
