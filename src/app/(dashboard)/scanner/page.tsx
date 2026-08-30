'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type ScanResult = {
  valid: boolean;
  reason: string;
  passName?: string;
  eventTitle?: string;
  gate?: string;
  debug?: any;
} | null;

export default function ScannerPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    loadHistory();
    return () => { stopScanner(); };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/data/verify');
      const data = await res.json();
      setScanHistory(data.slice(0, 10));
    } catch {}
  };

  const startScanner = async () => {
    setError('');
    setResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          stopScanner();
          await verifyCredential(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setError('Camera not available. Use manual entry below.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const verifyCredential = async (rawInput: string) => {
    try {
      const res = await fetch('/api/data/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: rawInput, gate: 'Main Gate' }),
      });
      const data = await res.json();
      setResult(data);
      loadHistory();
    } catch {
      setError('Verification failed. Please try again.');
    }
  };

  const handleManualVerify = async () => {
    if (!manualCode.trim()) return;
    setError('');
    setResult(null);
    await verifyCredential(manualCode.trim());
    setManualCode('');
  };

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen app-shell pb-8">
      {/* Header */}
      <div className="px-4 pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Scan Pass</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Point camera at QR code</p>
        </div>
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mx-4 mt-4 rounded-2xl p-6 text-center space-y-3 ${result.valid ? 'bg-green-950/30 border border-green-800/50' : 'bg-red-950/30 border border-red-800/50'}`}>
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${result.valid ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            {result.valid ? (
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div>
            <p className={`text-lg font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>{result.reason}</p>
            {result.passName && <p className="text-white font-medium mt-1">{result.passName}</p>}
            {result.eventTitle && <p className="text-neutral-400 text-sm">{result.eventTitle}</p>}
            {result.gate && result.valid && <p className="text-neutral-500 text-xs mt-1">Gate: {result.gate}</p>}
          </div>
          {!result.valid && result.debug && (
            <p className="text-neutral-600 text-[10px] font-mono">Debug: searched {result.debug.searched}, passes in DB: {result.debug.available}</p>
          )}
          <button onClick={handleReset} className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${result.valid ? 'bg-green-900/50 text-green-300 border border-green-800/50' : 'bg-red-900/50 text-red-300 border border-red-800/50'}`}>
            Scan Next
          </button>
        </div>
      )}

      {/* Scanner / Manual Input */}
      {!result && (
        <div className="px-4 mt-4 space-y-4">
          {/* Camera */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div id="qr-reader" className="w-full min-h-[250px] flex items-center justify-center bg-black">
              {!scanning && (
                <div className="text-center p-8 space-y-3">
                  <svg className="w-12 h-12 mx-auto text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  <p className="text-neutral-500 text-sm">Tap to start scanning</p>
                </div>
              )}
            </div>
            {!scanning && (
              <button onClick={startScanner} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 transition-all active:scale-[0.98]">Start Camera</button>
            )}
            {scanning && (
              <button onClick={stopScanner} className="w-full bg-neutral-800 text-neutral-300 font-medium py-3 transition-all">Stop Camera</button>
            )}
          </div>

          {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-neutral-500 text-xs uppercase tracking-wider font-medium">Or paste credential / QR content</p>
            <div className="flex gap-2">
              <input value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="PASS_xxx... or https://scenezy.app/v/PASS_xxx"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#2563eb] transition-all font-mono" />
              <button onClick={handleManualVerify} disabled={!manualCode.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                Verify
              </button>
            </div>
            <p className="text-neutral-700 text-[10px]">Accepts: raw credential, full QR URL, or any format containing the credential</p>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {scanHistory.length > 0 && !result && (
        <div className="px-4 mt-6 space-y-3">
          <h2 className="text-neutral-400 text-xs uppercase tracking-wider font-medium">Recent Scans</h2>
          <div className="space-y-2">
            {scanHistory.map((entry: any) => (
              <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl border ${entry.result === 'VALID' ? 'bg-green-950/10 border-green-900/30' : 'bg-red-950/10 border-red-900/30'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${entry.result === 'VALID' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-white text-xs font-medium">{entry.eventTitle} · {entry.passTypeName}</p>
                    <p className="text-neutral-500 text-[10px]">{new Date(entry.scannedAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase ${entry.result === 'VALID' ? 'text-green-400' : 'text-red-400'}`}>{entry.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
