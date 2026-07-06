"use client";

import dynamic from "next/dynamic";
import { QrCode, Scan } from "lucide-react";
const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

export default function QrScannerTab({ handleQrScanSuccess }) {
  return (
    <div className="dual-panel">
      <div className="panel-left">
        <div className="glass-card checker-box">
          <h2 className="panel-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <QrCode size={20} /> QR Code Scanner
          </h2>
          <p className="hero-subtitle">
            Aim your camera at a QR code, or upload an image, to safely extract and analyze its URL.
          </p>
          <QrScanner
            onScanSuccess={handleQrScanSuccess}
            onScanError={(err) => {}}
          />
        </div>
      </div>
      <div className="panel-right hide-on-mobile">
        <div className="glass-card result-placeholder" style={{ minHeight: "400px" }}>
          <div className="shield-check-icon" style={{ display: "flex", justifyContent: "center" }}>
            <Scan size={48} className="text-purple-400" />
          </div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "750",
              color: "var(--text-secondary)",
              marginBottom: "8px",
              marginTop: "16px"
            }}
          >
            QR Scan Ready
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "260px" }}>
            Once a QR code is detected, the extracted URL is automatically sent for analysis. Results will appear
            here.
          </p>
        </div>
      </div>
    </div>
  );
}
