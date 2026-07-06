"use client";

export default function Sidebar({ activeTab, setActiveTab, threatStats, navItems, isOnline }) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <svg className="logo-icon" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M256 80 L380 135 C380 270 315 365 256 425 C197 365 132 270 132 135 Z"
            fill="url(#shieldGradSide)"
            stroke="#8b5cf6"
            strokeWidth="8"
          />
          <defs>
            <linearGradient id="shieldGradSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <span className="sidebar-title">PhishGuard</span>
      </div>

      {/* Threat Stats */}
      <div className="sidebar-stats">
        <div className="stats-header">🎯 Threat Radar</div>
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
          <span className={`status-indicator ${isOnline ? "live" : "offline"}`}>
            <span className="pulse-dot"></span>
            {isOnline ? "⚡ Live Security Active" : "📴 Offline — Local Mode"}
          </span>
        </div>
      </div>
    </aside>
  );
}
