"use client";

import dynamic from "next/dynamic";
import { QrCode, Scan, ShieldAlert, BookOpen, Smartphone } from "lucide-react";
const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

export default function QrScannerTab({ handleQrScanSuccess }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT PANEL: Camera feed & file dropzone */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-primary">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy">QR Code Security Scanner</h2>
            <span className="text-[10px] text-text-muted block mt-0.5 font-medium">Deconstruct hidden links offline</span>
          </div>
        </div>
        
        <p className="text-xs text-text-secondary leading-relaxed">
          Phishing agents distribute QR codes in paper messages, post cards, and chats to bypass standard email gateways. Scan them securely to extract target URLs before opening.
        </p>

        <QrScanner
          onScanSuccess={handleQrScanSuccess}
          onScanError={(err) => {}}
        />
      </div>

      {/* RIGHT PANEL: Info & Diagnostic stats */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Info Placeholder */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mx-auto text-text-muted">
            <Scan className="h-8 w-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-navy">Scanner Ready</h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-[280px] mx-auto">
              Aim camera or drop QR screenshots. Extracted links are automatically resolved and audited.
            </p>
          </div>
        </div>

        {/* Diagnostic rules card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 mb-4">
            <BookOpen className="h-4 w-4 text-primary" /> QR Phishing Controls
          </h4>
          <div className="space-y-3.5 text-xs text-text-secondary">
            {[
              { title: "Direct Redirect Halts", desc: "Interrupts meta-redirect refreshes automatically." },
              { title: "Typosquat Intercepts", desc: "Validates host spelling distance." },
              { title: "Secure render isolated sandbox", desc: "Renders landing pages statically." }
            ].map((rule, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <div>
                  <span className="font-bold text-navy block leading-none">{rule.title}</span>
                  <span className="text-[10px] text-text-muted mt-1 block leading-relaxed">{rule.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
