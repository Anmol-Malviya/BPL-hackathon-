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
      startScanning(selectedCameraId);
    }
  };

  const handleCameraChange = (e) => {
    const id = e.target.value;
    setSelectedCameraId(id);
    if (isScanning) {
      startScanning(id);
    }
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
            <div className="placeholder-icon">📷</div>
            <p>Ready to Scan QR Codes</p>
            <button 
              onClick={handleToggleScan}
              className="btn btn-primary"
              disabled={hasCameraPermission === false && !errorMsg}
            >
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
      </div>

      {/* Camera selection and controls */}
      {isScanning && (
        <div className="scanner-controls">
          <div className="select-container">
            <label htmlFor="camera-select">Select Camera:</label>
            <select
              id="camera-select"
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="select-field"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>

          <button onClick={stopScanning} className="btn btn-danger">
            Stop Camera
          </button>
        </div>
      )}

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
        <p className="section-subtitle">Upload an image of a QR code from your gallery</p>
        <button onClick={triggerFileInput} className="btn btn-secondary btn-full">
          📂 Choose from Gallery / Files
        </button>
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
