"use client";

import { useMemo } from "react";
import { History, FolderOpen, Trash2, ArrowRight } from "lucide-react";

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
    setActiveTab("url-scanner");
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Scan Diagnostic logs
        </h2>
        {scanHistory.length > 0 && (
          <button 
            onClick={handleClearHistory} 
            className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-xs font-semibold text-red-700 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" /> Purge Logs
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "ALL", label: "All Logs", color: "border-slate-200 hover:bg-slate-50 text-text-secondary" },
          { id: "SAFE", label: "Safe Checks", color: "bg-green-50/50 border-green-200 text-green-700 hover:bg-green-50" },
          { id: "SUSPICIOUS", label: "Suspicious", color: "bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-50" },
          { id: "DANGEROUS", label: "Phishing threats", color: "bg-red-50/50 border-red-200 text-red-700 hover:bg-red-50" }
        ].map((f) => {
          const isActive = historyFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setHistoryFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive 
                  ? "bg-navy border-navy text-white shadow-sm" 
                  : f.color
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List content */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mx-auto text-text-muted">
            <FolderOpen className="h-6 w-6 opacity-60" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-navy">No diagnostic logs found</p>
            <p className="text-[10px] text-text-secondary">Records matching this security filter category are empty.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredHistory.map((item, index) => {
            const badgeColor = 
              item.rating === "SAFE" ? "bg-green-100 text-green-800 border-green-200" :
              item.rating === "SUSPICIOUS" ? "bg-amber-100 text-amber-800 border-amber-200" :
              "bg-red-100 text-red-800 border-red-200";

            return (
              <div
                key={index}
                onClick={() => handleHistoryItemClick(item)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="min-w-0 flex-grow">
                  <span className="block text-xs font-bold text-navy truncate group-hover:text-primary transition-colors max-w-[280px] sm:max-w-md">{item.url}</span>
                  <span className="text-[10px] text-text-muted mt-1 block">{item.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                    {item.rating}
                  </span>
                  <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Inspect <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
