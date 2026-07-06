"use client";

import { Activity, Zap, WifiOff } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, threatStats, navItems, isOnline }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <img className="logo-icon" src="/ic_app_logo.png" alt="Secure OS Logo" />
        <span className="sidebar-title">Secure OS</span>
      </div>

      {/* Threat Stats */}
      <div className="sidebar-stats">
        <div className="stats-header" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Activity size={12} /> Threat Radar
        </div>
        <div className="stats-grid">
          <div className="stat-item safe">
            <span className="stat-count">{threatStats.safe}</span>
            <span className="stat-label">Safe</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-count">{threatStats.suspicious}</span>
            <span className="stat-label">Suspicious</span>
          </div>
          <div className="stat-item danger">
            <span className="stat-count">{threatStats.dangerous}</span>
            <span className="stat-label">Threats</span>
          </div>
        </div>
      </div>

      {/* Sidebar Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="sidebar-footer">
        <div className="connection-status">
          <span className={`status-indicator ${isOnline ? "live" : "offline"}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span className="pulse-dot"></span>
            {isOnline ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Zap size={12} /> Live Security Active
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <WifiOff size={12} /> Offline — Local Mode
              </span>
            )}
          </span>
        </div>
      </div>
    </aside>
  );
}
