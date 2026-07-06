"use client";

export default function Header({ isOnline }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <svg className="header-logo" viewBox="0 0 512 512" fill="none">
          <path
            d="M256 80 L380 135 C380 270 315 365 256 425 C197 365 132 270 132 135 Z"
            fill="url(#hdrGrad)"
            stroke="#8b5cf6"
            strokeWidth="8"
          />
          <defs>
            <linearGradient id="hdrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <span className="app-title">Secure OS</span>
      </div>
      {isOnline ? (
        <span className="online-badge">⚡ Live</span>
      ) : (
        <span className="offline-badge">📴 Offline</span>
      )}
    </header>
  );
}
