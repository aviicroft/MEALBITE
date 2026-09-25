"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  verifyAndCollectQrAction,
  ScanVerificationResult,
} from "@/actions/scanner.actions";

export const QrScannerComponent: React.FC = () => {
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanVerificationResult | null>(null);
  const [scannerActive] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const handleVerify = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const result = await verifyAndCollectQrAction(token);
      setScanResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification error";
      setScanResult({
        success: false,
        message: "Verification Failed",
        error: msg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!scannerActive) return;

    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        // Successful camera scan
        if (decodedText && !loadingRef.current) {
          handleVerify(decodedText);
        }
      },
      () => {
        // Ignored frame scan error
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.warn("Scanner cleanup notice:", err);
        });
      }
    };
  }, [scannerActive, handleVerify]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleVerify(manualToken.trim());
  };

  const handleReset = () => {
    setScanResult(null);
    setManualToken("");
  };

  return (
    <div className="space-y-6">
      {/* Verification Result Banner (Instant feedback for Warden) */}
      {scanResult && (
        <div
          role="alert"
          className={`p-5 rounded-2xl border-2 shadow-sm animate-in fade-in zoom-in-95 ${
            scanResult.success
              ? "bg-emerald-50 border-emerald-400 text-emerald-950"
              : "bg-rose-50 border-rose-400 text-rose-950"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  scanResult.success
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {scanResult.success ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {scanResult.message}
                </h3>
                {scanResult.error && (
                  <p className="text-xs font-semibold text-rose-800 mt-0.5">
                    {scanResult.error}
                  </p>
                )}
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleReset}>
              Ready Next Scan
            </Button>
          </div>

          {/* Student & Meal Issuance Card if Verified */}
          {scanResult.success && (
            <div className="mt-4 pt-4 border-t border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  Student Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {scanResult.studentName}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  Meal Issued
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {scanResult.mealType}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  Collection Time
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {scanResult.collectedAt}
                </span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  Verified By
                </span>
                <span className="font-bold text-slate-900 text-sm truncate block">
                  {scanResult.collectedBy}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Scanning Frame */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">
              Live Camera Scanner
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Point camera at student&apos;s phone QR pass
          </span>
        </div>

        {/* html5-qrcode target container */}
        <div
          id="qr-reader"
          className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-w-md mx-auto"
        ></div>

        {loading && (
          <div className="text-center py-2 text-xs text-indigo-600 flex items-center justify-center space-x-2 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Validating token on server...</span>
          </div>
        )}
      </div>

      {/* Manual Token Verification Fallback */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <QrCode className="w-4 h-4 text-purple-600" />
          Manual QR Token Entry (Fallback / Barcode Input)
        </h3>
        <p className="text-xs text-slate-500">
          If student screen brightness is low or camera access is restricted, paste
          or enter the QR token directly:
        </p>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Paste or type 48-char QR token..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <Button
            type="submit"
            size="sm"
            isLoading={loading}
            disabled={!manualToken.trim()}
          >
            Verify & Collect
          </Button>
        </form>
      </div>
    </div>
  );
};
