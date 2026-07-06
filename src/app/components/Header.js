"use client";

import { Zap, WifiOff } from "lucide-react";

export default function Header({ isOnline }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <img className="header-logo" src="/ic_app_logo.png" alt="Secure OS Logo" />
        <span className="app-title">Secure OS</span>
      </div>
      {isOnline ? (
        <span className="online-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <Zap size={11} /> Live
        </span>
      ) : (
        <span className="offline-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <WifiOff size={11} /> Offline
        </span>
      )}
    </header>
  );
}
