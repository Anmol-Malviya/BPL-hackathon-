"use client";

import { useMemo } from "react";

export default function HistoryTab({
  scanHistory,
  historyFilter,
  setHistoryFilter,
  handleClearHistory,
  setUrlInput,
  handleCheckUrl,
  setActiveTab,
  getRatingColorClass,
}) {
  const filteredHistory = useMemo(() => {
    if (historyFilter === "ALL") return scanHistory;
    return scanHistory.filter((h) => h.rating === historyFilter);
  }, [scanHistory, historyFilter]);

  const handleHistoryItemClick = (item) => {
    setUrlInput(item.url);
    handleCheckUrl(item.url);
    setActiveTab("check");
  };

  return (
    <div className="glass-card" style={{ padding: "32px" }}>
      <div className="history-header">
        <h2 className="history-title">📜 Scan History</h2>
        {scanHistory.length > 0 && (
          <button onClick={handleClearHistory} className="clear-history-btn">
            Clear All
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="history-filters-container">
        {["ALL", "SAFE", "SUSPICIOUS", "DANGEROUS"].map((f) => (
          <button
            key={f}
            onClick={() => setHistoryFilter(f)}
            className={`filter-btn ${historyFilter === f ? "active" : ""}`}
          >
            {f === "ALL"
              ? "All Scans"
              : f === "SAFE"
              ? "✅ Safe"
              : f === "SUSPICIOUS"
              ? "⚠️ Suspicious"
              : "🚨 Dangerous"}
          </button>
        ))}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📂</span>
          <p>No scans match this filter.</p>
          <p style={{ fontSize: "12px" }}>Your scanned links will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item, index) => (
            <div
              key={index}
              className="history-item glass-card"
              onClick={() => handleHistoryItemClick(item)}
            >
              <div className="history-item-info">
                <span className="history-item-url">{item.url}</span>
                <span className="history-item-date">{item.date}</span>
              </div>
              <span className={`history-item-badge ${getRatingColorClass(item.rating)}`}>
                {item.rating}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
