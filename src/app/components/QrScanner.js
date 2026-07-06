"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onScanSuccess, onScanError }) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileScanError, setFileScanError] = useState("");

  const qrReaderRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize cameras list
  useEffect(() => {
    // Check if mediaDevices are supported
    if (typeof window !== "undefined" && navigator.mediaDevices) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to the back camera if available, otherwise the first camera
            const backCamera = devices.find((device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment")
            );
            setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
            setHasCameraPermission(true);
          } else {
            setHasCameraPermission(false);
            setErrorMsg("No cameras found on this device.");
          }
        })
        .catch((err) => {
          console.error("Error getting cameras:", err);
          setHasCameraPermission(false);
          setErrorMsg("Camera permission denied or not accessible.");
        });
    }

    return () => {
      // Cleanup: stop scanner if running
      stopScanning();
    };
  }, []);

  const startScanning = async (cameraId) => {
    if (!cameraId) return;
    setErrorMsg("");
    setScanResult("");

    try {
      if (html5QrCodeRef.current) {
        await stopScanning();
      }

      const html5QrCode = new Html5Qrcode("qr-scanner-view");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        },
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          setScanResult(decodedText);
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
          stopScanning();
        },
        (errorMessage) => {
          // Silent scan failure (usually just searching frame by frame)
          if (onScanError) {
            onScanError(errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanning:", err);
      setErrorMsg("Could not start camera stream. Ensure camera is not used by another app.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanning:", err);
      }
    }
  };

  const handleToggleScan = () => {
    if (isScanning) {
      stopScanning();
    } else {
      let camId = selectedCameraId;
      if (!camId && cameras.length > 0) {
        const backCamera = cameras.find((device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
        );
        camId = backCamera ? backCamera.id : cameras[0].id;
        setSelectedCameraId(camId);
      }
      startScanning(camId);
    }
  };

  const handleFlipCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setSelectedCameraId(nextCameraId);
    if (isScanning) {
      startScanning(nextCameraId);
    }
  };

  const getActiveCameraLabel = () => {
    const activeCam = cameras.find((c) => c.id === selectedCameraId);
    if (!activeCam) return "Live Scanner";
    const label = activeCam.label.toLowerCase();
    if (label.includes("back") || label.includes("environment") || label.includes("rear")) return "Rear Camera";
    if (label.includes("front") || label.includes("user")) return "Front Camera";
    return activeCam.label || `Camera ${cameras.indexOf(activeCam) + 1}`;
  };

  // Handle file upload scanning
  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileScanError("");
    setScanResult("");

    try {
      // Create temporary scanner instance
      const html5QrCode = new Html5Qrcode("qr-file-dummy-container");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      setScanResult(decodedText);
      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
      
      // Cleanup dummy container right after
      html5QrCode.clear();
    } catch (err) {
      console.error("Error scanning file:", err);
      setFileScanError("Could not detect a QR code in this image. Try another or adjust lighting.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="qr-scanner-wrapper">
      {/* Target for camera scan */}
      <div className="scanner-container">
        {!isScanning && (
          <div className="scanner-placeholder">
            <div className="placeholder-glow"></div>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="placeholder-svg">
              <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke="url(#primaryGrad)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 8V6C20 4.89543 19.1046 4 18 4H16" stroke="url(#primaryGrad)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 16V18C4 19.1046 4.89543 20 6 20H8" stroke="url(#primaryGrad)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 16V18C20 19.1046 19.1046 20 18 20H16" stroke="url(#primaryGrad)" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="7" y="7" width="10" height="10" rx="2" stroke="#fff" strokeWidth="2" strokeDasharray="3 3"/>
              <path d="M10 12H14M12 10V14" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="primaryGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--color-primary)"/>
                  <stop offset="1" stopColor="var(--color-secondary)"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="placeholder-text-group">
              <h3>QR Scanner</h3>
              <p>Scan safe links instantly using your camera</p>
            </div>
            <button 
              onClick={handleToggleScan}
              className="btn btn-primary btn-scan-start"
              disabled={hasCameraPermission === false && !errorMsg}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Start Camera Scan
            </button>
          </div>
        )}

        <div 
          id="qr-scanner-view" 
          className="scanner-view"
          style={{ display: isScanning ? "block" : "none", width: "100%", height: "100%" }}
        ></div>

        {isScanning && (
          <div className="scanner-overlay">
            <div className="scanner-laser"></div>
            <div className="scanner-corner top-left"></div>
            <div className="scanner-corner top-right"></div>
            <div className="scanner-corner bottom-left"></div>
            <div className="scanner-corner bottom-right"></div>
          </div>
        )}

        {/* Floating live status overlay */}
        {isScanning && (
          <div className="scanner-status-overlay">
            <span className="scanner-status-dot"></span>
            <span className="scanner-status-text">
              {getActiveCameraLabel()}
            </span>
          </div>
        )}

        {/* Floating controls inside viewport */}
        {isScanning && (
          <div className="scanner-actions-overlay">
            <button 
              onClick={stopScanning} 
              className="action-circle-btn stop-btn"
              title="Stop Scanning"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
              </svg>
            </button>

            {cameras.length > 1 && (
              <button 
                onClick={handleFlipCamera} 
                className="action-circle-btn flip-btn"
                title="Flip Camera"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* File Upload Scanning Section */}
      <div className="file-scan-section">
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div 
          onClick={triggerFileInput} 
          className="upload-dropzone glass-card"
        >
          <div className="upload-icon-container">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-svg">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="upload-text-content">
            <p className="upload-main-text">Upload QR Code Image</p>
            <p className="upload-sub-text">Drag & drop or tap to browse library</p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileScan}
          accept="image/*"
          style={{ display: "none" }}
        />
        {fileScanError && (
          <div className="error-message mt-2">
            <span className="error-icon">⚠️</span>
            <span>{fileScanError}</span>
          </div>
        )}
      </div>

      {/* Hidden dummy container for library's file scanning requirements */}
      <div id="qr-file-dummy-container" style={{ display: "none" }}></div>
    </div>
  );
}
