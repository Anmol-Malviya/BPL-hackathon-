"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScanSuccess, onScanError }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isScanning, setIsScanning]   = useState(false);
  const [cameras, setCameras]         = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanResult, setScanResult]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [fileScanError, setFileScanError] = useState("");
  const [isDragging, setIsDragging]   = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const [fileScanSuccess, setFileScanSuccess] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ─── Init cameras ────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const back = devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(back ? back.id : devices[0].id);
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
          setErrorMsg("No cameras found on this device.");
        }
      })
      .catch(() => {
        setHasCameraPermission(false);
        setErrorMsg("Camera permission denied or not accessible.");
      });

    return () => { stopScanning(); };
  }, []);

  // ─── Start scanning ───────────────────────────────────────────
  const startScanning = async (cameraId) => {
    if (!cameraId) return;
    setErrorMsg("");
    setScanResult("");
    setFileScanError("");
    setFileScanSuccess(false);

    try {
      if (html5QrCodeRef.current) await stopScanning();

      const qr = new Html5Qrcode("qr-scanner-view");
      html5QrCodeRef.current = qr;

      await qr.start(
        cameraId,
        {
          fps: 12,
          qrbox: (w, h) => {
            const s = Math.max(50, Math.min(w, h) * 0.65);
            return { width: s, height: s };
          },
          aspectRatio: 1.0,
        },
        (decoded) => {
          setScanResult(decoded);
          stopScanning();
          if (onScanSuccess) onScanSuccess(decoded);
        },
        (err) => { if (onScanError) onScanError(err); }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      setErrorMsg("Could not start camera. Make sure another app isn't using it.");
      setIsScanning(false);
    }
  };

  // ─── Stop scanning ────────────────────────────────────────────
  const stopScanning = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // ─── Toggle / flip ────────────────────────────────────────────
  const handleToggle = () => {
    if (isScanning) {
      stopScanning();
    } else {
      let id = selectedCameraId;
      if (!id && cameras.length > 0) {
        const back = cameras.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("environment")
        );
        id = back ? back.id : cameras[0].id;
        setSelectedCameraId(id);
      }
      startScanning(id);
    }
  };

  const handleFlip = () => {
    if (cameras.length <= 1) return;
    const idx    = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextId = cameras[(idx + 1) % cameras.length].id;
    setSelectedCameraId(nextId);
    if (isScanning) startScanning(nextId);
  };

  const cameraLabel = () => {
    const cam = cameras.find((c) => c.id === selectedCameraId);
    if (!cam) return "Camera";
    const l = cam.label.toLowerCase();
    if (l.includes("back") || l.includes("environment") || l.includes("rear")) return "Rear Camera";
    if (l.includes("front") || l.includes("user")) return "Front Camera";
    return `Camera ${cameras.indexOf(cam) + 1}`;
  };

  // ─── File / drag-and-drop scan ────────────────────────────────
  const scanFile = async (file) => {
    if (!file) return;
    setFileScanError("");
    setScanResult("");
    setFileScanSuccess(false);
    setIsFileScanning(true);

    try {
      const qr = new Html5Qrcode("qr-file-dummy-container");
      const decoded = await qr.scanFile(file, true);
      qr.clear();
      setScanResult(decoded);
      setFileScanSuccess(true);
      if (onScanSuccess) onScanSuccess(decoded);
    } catch {
      setFileScanError("No QR code detected. Try a clearer image or better lighting.");
    } finally {
      setIsFileScanning(false);
    }
  };

  const handleFileChange = (e) => scanFile(e.target.files[0]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) scanFile(file);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="qr-root">

      {/* ── VIEWFINDER ─────────────────────────────────────── */}
      <div className={`qr-viewfinder ${isScanning ? "active" : ""}`}>

        {/* idle state */}
        {!isScanning && (
          <div className="qr-idle">
            <div className="qr-idle-glow" />
            {/* animated QR icon */}
            <div className="qr-idle-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="url(#qrGrad)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="5" height="5" rx="1"/>
                <rect x="16" y="3" width="5" height="5" rx="1"/>
                <rect x="3" y="16" width="5" height="5" rx="1"/>
                <rect x="16" y="16" width="5" height="5" rx="1"/>
                <path d="M9 4h6M9 20h6M4 9v6M20 9v6"/>
                <rect x="10" y="10" width="4" height="4" rx="0.5" fill="url(#qrGrad)" stroke="none"/>
                <defs>
                  <linearGradient id="qrGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8b5cf6"/>
                    <stop offset="1" stopColor="#06b6d4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="qr-idle-title">Point Camera at QR Code</p>
            <p className="qr-idle-sub">Position the QR code inside the frame to scan automatically</p>
          </div>
        )}

        {/* actual camera feed */}
        <div
          id="qr-scanner-view"
          className="qr-feed"
          style={{ display: isScanning ? "block" : "none" }}
        />

        {/* corner brackets overlay */}
        {isScanning && (
          <div className="qr-brackets">
            <span className="qr-bracket tl"/>
            <span className="qr-bracket tr"/>
            <span className="qr-bracket bl"/>
            <span className="qr-bracket br"/>
            <div className="qr-laser"/>
          </div>
        )}

        {/* top status pill */}
        {isScanning && (
          <div className="qr-status-pill">
            <span className="qr-live-dot"/>
            <span>{cameraLabel()}</span>
          </div>
        )}

        {/* bottom controls bar */}
        <div className="qr-controls">
          <button
            onClick={handleToggle}
            className={`qr-main-btn ${isScanning ? "stop" : "start"}`}
            disabled={hasCameraPermission === false}
          >
            {isScanning ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="3"/>
                </svg>
                Stop Camera
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Start Camera
              </>
            )}
          </button>

          {cameras.length > 1 && (
            <button
              onClick={handleFlip}
              className="qr-flip-btn"
              title="Flip Camera"
              disabled={!isScanning}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/>
                <path d="M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* error message */}
      {errorMsg && (
        <div className="qr-error-bar" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangle size={14} className="text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* success result */}
      {scanResult && (
        <div className="qr-success-bar">
          <span className="qr-success-icon">✓</span>
          <div>
            <p className="qr-success-label">QR Code Detected — Analyzing...</p>
            <p className="qr-success-url">{scanResult}</p>
          </div>
        </div>
      )}

      {/* ── DIVIDER ────────────────────────────────────────── */}
      <div className="qr-divider"><span>OR</span></div>

      {/* ── DRAG & DROP UPLOAD ──────────────────────────────── */}
      <div
        className={`qr-dropzone ${isDragging ? "dragging" : ""} ${fileScanSuccess ? "success" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {isFileScanning ? (
          <div className="qr-dropzone-content">
            <div className="qr-file-spinner"/>
            <p className="qr-dropzone-title">Scanning image...</p>
          </div>
        ) : fileScanSuccess ? (
          <div className="qr-dropzone-content">
            <div className="qr-dropzone-check">✓</div>
            <p className="qr-dropzone-title" style={{color:"var(--color-safe)"}}>QR Code Found!</p>
            <p className="qr-dropzone-sub">Tap to scan another image</p>
          </div>
        ) : (
          <div className="qr-dropzone-content">
            <div className="qr-dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h1v1M14 18h1M18 14h1M18 18h1"/>
              </svg>
            </div>
            <div>
              <p className="qr-dropzone-title">{isDragging ? "Drop image here" : "Upload QR Code Image"}</p>
              <p className="qr-dropzone-sub">Drag & drop or tap to browse · PNG, JPG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      {fileScanError && (
        <div className="qr-error-bar" style={{marginTop:"10px", display: "inline-flex", alignItems: "center", gap: "6px"}}>
          <AlertTriangle size={14} className="text-red-400" />
          <span>{fileScanError}</span>
        </div>
      )}

      {/* Hidden dummy container required by html5-qrcode for file scans */}
      <div id="qr-file-dummy-container" style={{ display: "none" }}/>
    </div>
  );
}
