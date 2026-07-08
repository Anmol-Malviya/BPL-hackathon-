"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle, Camera, UploadCloud, RefreshCw, CheckCircle2, VideoOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScanSuccess, onScanError }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null); // null = unknown
  const [isScanning, setIsScanning]   = useState(false);
  const [cameras, setCameras]         = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanResult, setScanResult]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [fileScanError, setFileScanError] = useState("");
  const [isDragging, setIsDragging]   = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const [fileScanSuccess, setFileScanSuccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ─── Stop scanning (stable reference via useCallback) ─────────
  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (_) {}
      try { html5QrCodeRef.current.clear(); } catch (_) {}
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // ─── Init cameras ────────────────────────────────────────────
  const initCameras = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      setHasCameraPermission(false);
      setErrorMsg("Your browser does not support camera access.");
      return;
    }

    setIsInitializing(true);
    setErrorMsg("");

    try {
      // STEP 1: Explicitly request camera permission first.
      // Without this, getCameras() may return empty on Chrome / Edge even if a camera exists,
      // because device labels are hidden until the user grants access.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // Immediately release the test stream — we only needed it to trigger the browser prompt.
      stream.getTracks().forEach((track) => track.stop());

      // STEP 2: Enumerate cameras. Labels will now be populated.
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer the back/environment camera on mobile.
        const back = devices.find((d) => {
          const l = (d.label || "").toLowerCase();
          return l.includes("back") || l.includes("environment") || l.includes("rear");
        });
        const preferredId = back ? back.id : devices[0].id;
        setSelectedCameraId(preferredId);
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
        setErrorMsg("No cameras were found on this device.");
      }
    } catch (err) {
      setHasCameraPermission(false);
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorMsg(
          "Camera access was denied. Please allow camera permission in your browser's site settings and try again."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setErrorMsg("No camera device was detected. Make sure a camera is connected and enabled.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setErrorMsg(
          "Camera is already in use by another app. Close other apps using the camera and try again."
        );
      } else if (name === "OverconstrainedError") {
        setErrorMsg("Could not find a camera matching the required constraints.");
      } else if (name === "SecurityError") {
        setErrorMsg("Camera access is blocked due to a security policy. Make sure the page is served over HTTPS.");
      } else {
        setErrorMsg(`Camera error: ${err?.message || "Unknown error occurred."}`);
      }
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initCameras();
    return () => { stopScanning(); };
  }, [initCameras, stopScanning]);

  // ─── Start scanning ───────────────────────────────────────────
  const startScanning = useCallback(async (cameraId) => {
    if (!cameraId) return;
    setErrorMsg("");
    setScanResult("");
    setFileScanError("");
    setFileScanSuccess(false);

    try {
      await stopScanning();

      // Ensure the DOM container is ready
      const container = document.getElementById("qr-scanner-view");
      if (!container) {
        setErrorMsg("Scanner container not found. Please refresh the page.");
        return;
      }

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
        (err) => {
          // Frame-level errors are normal (no QR in frame), ignore them
          if (onScanError) onScanError(err);
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera start failed:", err);
      const name = err?.name || "";
      if (name === "NotReadableError" || name === "TrackStartError") {
        setErrorMsg("Camera is in use by another app. Close it and try again.");
      } else if (name === "NotAllowedError") {
        setErrorMsg("Camera permission denied. Please update your browser settings.");
        setHasCameraPermission(false);
      } else {
        setErrorMsg(`Could not start camera: ${err?.message || "Unknown error."}`);
      }
      setIsScanning(false);
    }
  }, [stopScanning, onScanSuccess, onScanError]);

  // ─── Toggle / flip ────────────────────────────────────────────
  const handleToggle = () => {
    if (isScanning) {
      stopScanning();
    } else {
      let id = selectedCameraId;
      if (!id && cameras.length > 0) {
        const back = cameras.find((d) => {
          const l = (d.label || "").toLowerCase();
          return l.includes("back") || l.includes("environment") || l.includes("rear");
        });
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
    const l = (cam.label || "").toLowerCase();
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

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Viewfinder block */}
      <div className="relative aspect-video max-w-md mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden flex flex-col justify-center items-center">

        {/* Idle state */}
        {!isScanning && (
          <div className="text-center p-6 space-y-3 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mx-auto text-slate-300">
              {isInitializing
                ? <RefreshCw className="h-6 w-6 animate-spin" />
                : hasCameraPermission === false
                  ? <VideoOff className="h-6 w-6 text-red-400" />
                  : <Camera className="h-6 w-6" />
              }
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {isInitializing
                  ? "Detecting camera…"
                  : hasCameraPermission === false
                    ? "Camera unavailable"
                    : "Interactive Camera Scan"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isInitializing
                  ? "Requesting access from browser"
                  : hasCameraPermission === false
                    ? "Check permission or connection"
                    : "Activate feed to trace QR code routing."}
              </p>
            </div>
          </div>
        )}

        {/* Camera container — always rendered so Html5Qrcode can attach */}
        <div
          id="qr-scanner-view"
          className="w-full h-full object-cover"
          style={{ display: isScanning ? "block" : "none" }}
        />

        {/* Corner Brackets Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <div className="relative w-40 h-40 border border-white/20">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
              {/* Scan sweeping laser */}
              <div className="absolute h-0.5 w-full bg-primary/80 top-0 animate-scanning-bar" />
            </div>
          </div>
        )}

        {/* Top Status Badge */}
        {isScanning && (
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1 text-[9px] font-bold text-white flex items-center gap-1.5 z-20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>{cameraLabel()}</span>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-3 inset-x-3 flex gap-2 z-20 justify-center">
          {/* Retry permission button */}
          {hasCameraPermission === false && !isInitializing && (
            <button
              onClick={initCameras}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}

          {/* Activate / Deactivate */}
          {hasCameraPermission !== false && (
            <button
              onClick={handleToggle}
              disabled={hasCameraPermission !== true || isInitializing}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5 transition-all ${
                isScanning
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isInitializing
                ? "Detecting…"
                : isScanning
                  ? "Deactivate Camera"
                  : "Activate Camera"}
            </button>
          )}

          {/* Flip Camera */}
          {cameras.length > 1 && (
            <button
              onClick={handleFlip}
              disabled={!isScanning}
              className="p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-white disabled:opacity-40 transition-colors"
              title="Flip Feed Source"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Permission / camera error bar */}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-start gap-2 max-w-md mx-auto">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scan success bar */}
      {scanResult && (
        <div className="p-3 bg-green-50 text-green-800 rounded-xl border border-green-200 text-xs flex items-start gap-2.5 max-w-md mx-auto">
          <CheckCircle2 className="h-4.5 w-4.5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">QR code detected</span>
            <span className="text-[10px] text-green-700 font-mono block mt-0.5 truncate select-all">{scanResult}</span>
          </div>
        </div>
      )}

      <div className="relative max-w-md mx-auto">
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200/60 -z-10" />
        <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-text-muted mx-auto block w-max">
          OR AUDIT IMAGE FILE
        </span>
      </div>

      {/* Drag & Drop File scanner */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`max-w-md mx-auto border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-slate-200 hover:border-slate-300 text-text-secondary bg-slate-50/50"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {isFileScanning ? (
          <div className="space-y-3">
            <RefreshCw className="h-7 w-7 text-primary animate-spin mx-auto" />
            <p className="text-xs font-bold text-navy">Decompressing image bytes…</p>
          </div>
        ) : fileScanSuccess ? (
          <div className="space-y-2">
            <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto font-bold text-sm">✓</span>
            <p className="text-xs font-bold text-green-600">Scan Complete!</p>
            <p className="text-[9px] text-text-muted">Tap to load another file</p>
          </div>
        ) : (
          <div className="space-y-3">
            <UploadCloud className="h-8 w-8 text-text-muted mx-auto" />
            <div>
              <p className="text-xs font-bold text-navy">Upload QR Code Screenshot</p>
              <p className="text-[10px] text-text-muted mt-0.5">Drag image file here, or tap to browse</p>
            </div>
          </div>
        )}
      </div>

      {fileScanError && (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{fileScanError}</span>
        </div>
      )}

      {/* Hidden container required by Html5Qrcode for file scanning */}
      <div id="qr-file-dummy-container" className="hidden" />
    </div>
  );
}
