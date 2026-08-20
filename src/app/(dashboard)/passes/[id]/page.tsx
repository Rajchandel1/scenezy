'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PassService, Pass } from '@/features/passes';
import { TransferService, Transfer } from '@/features/transfers';
import { QRCodeSVG } from 'qrcode.react';

export default function PassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pass, setPass] = useState<Pass | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<Transfer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await PassService.getPassById(params.id as string);
      setPass(p);
      if (p) {
        const t = await TransferService.getPendingTransferForPass(p.id);
        setPendingTransfer(t);
      }
      setLoaded(true);
    }
    load();
  }, [params.id]);

  const copyCredential = async () => {
    if (!pass) return;
    try {
      await navigator.clipboard.writeText(pass.credential);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = pass.credential;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!loaded) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><p className="text-neutral-500">Loading pass...</p></div>;
  if (!pass) return <div className="px-4 pt-6 text-center"><p className="text-neutral-500">Pass not found</p><button onClick={() => router.back()} className="text-[#c4f000] text-sm mt-2">Go back</button></div>;

  const dateObj = new Date(pass.eventDate);
  const dateStr = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isTransferPending = pendingTransfer !== null;
  const qrValue = `https://scenezy.app/v/${pass.credential}`;

  if (showQR) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[300px] space-y-6 text-center">
          <div className="space-y-1">
            <p className="text-neutral-500 text-xs uppercase tracking-wider">{pass.passTypeName} Pass</p>
            <h1 className="text-white text-xl font-bold">{pass.eventTitle}</h1>
            <p className="text-neutral-400 text-sm">{dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {pass.eventTime}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 mx-auto inline-block">
            <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={false} />
          </div>

          <div className="space-y-3">
            <p className="text-neutral-400 text-sm">Show this at entry</p>
            {isTransferPending && <p className="text-orange-400 text-xs">Transfer pending - pass valid until claimed</p>}
            
            {/* Full credential with copy button */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">Credential (tap to copy)</p>
              <button onClick={copyCredential} className="w-full text-left">
                <p className="text-[#c4f000] text-xs font-mono break-all">{pass.credential}</p>
              </button>
              {copied && <p className="text-[#c4f000] text-[10px]">Copied!</p>}
            </div>
          </div>

          <button onClick={() => setShowQR(false)} className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3 rounded-xl transition-all active:scale-[0.98]">
            ← Back to Pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="h-1.5 bg-gradient-to-r from-[#c4f000] to-[#c4f000]/60" />
      <div className="px-4 pt-5 space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          My Passes
        </button>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider bg-[#c4f000]/10 text-[#c4f000] border border-[#c4f000]/30 px-2 py-0.5 rounded-md font-medium">{pass.passTypeName}</span>
            {isTransferPending ? (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium border bg-orange-950/30 text-orange-400 border-orange-900/50">TRANSFER PENDING</span>
            ) : (
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium border ${pass.status === 'USED' ? 'bg-neutral-800 text-neutral-500 border-neutral-700' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>{pass.status}</span>
            )}
          </div>
          <h1 className="text-white text-2xl font-bold">{pass.eventTitle}</h1>
        </div>

        {isTransferPending && (
          <div className="bg-orange-950/20 border border-orange-900/40 rounded-xl p-3 space-y-1">
            <p className="text-orange-300 text-sm font-medium">Transfer pending</p>
            <p className="text-orange-400/70 text-xs">Sent to {pendingTransfer?.recipientIdentifier}. Pass still valid until claimed.</p>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <div><p className="text-white text-sm">{dateStr}</p><p className="text-neutral-500 text-xs">{pass.eventTime}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div><p className="text-white text-sm">{pass.eventVenue}</p><p className="text-neutral-500 text-xs">{pass.eventLocation}</p></div>
          </div>
        </div>

        <button onClick={() => setShowQR(true)} disabled={pass.status !== 'ACTIVE'}
          className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          {pass.status === 'ACTIVE' ? 'SHOW QR' : pass.status === 'USED' ? 'ALREADY USED' : 'NOT AVAILABLE'}
        </button>

        {pass.status === 'ACTIVE' && !isTransferPending && (
          <button onClick={() => router.push(`/passes/${pass.id}/transfer`)}
            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Give to a friend
          </button>
        )}

        <p className="text-center text-neutral-700 text-[10px]">Pass ID: {pass.id}</p>
      </div>
    </div>
  );
}
