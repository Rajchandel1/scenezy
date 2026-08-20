'use client';

import Link from 'next/link';
import { usePWAInstall } from '@/shared/lib/use-pwa';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari && !isInstalled) {
      setShowIOSHint(true);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      await install();
    } else if (showIOSHint) {
      // Already showing hint
    } else {
      setShowIOSHint(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#c4f000]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#c4f000]/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-8 min-h-screen flex flex-col">
        
        {/* Top Nav */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#c4f000] rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Scenezy</span>
          </div>
          <Link href="/sign-in" className="text-neutral-400 text-sm hover:text-white transition-colors">Sign In</Link>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#c4f000]/10 border border-[#c4f000]/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 bg-[#c4f000] rounded-full animate-pulse" />
              <span className="text-[#c4f000] text-[11px] font-medium">Now Live</span>
            </div>
            
            <h1 className="text-white text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
              Your events.<br/>
              <span className="text-[#c4f000]">Your passes.</span><br/>
              Simple.
            </h1>
            
            <p className="text-neutral-400 text-base leading-relaxed max-w-[280px]">
              Discover events, buy passes, show QR at entry. Transfer to friends in one tap.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/sign-up" className="block w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-4 rounded-2xl text-center transition-all active:scale-[0.98] text-base">
              Get Started Free
            </Link>
            
            <button onClick={handleInstall} disabled={isInstalled}
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {isInstalled ? 'App Installed ✓' : 'Install App'}
            </button>
          </div>

          {/* iOS Install Hint */}
          {showIOSHint && !isInstalled && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
              <p className="text-white text-sm font-medium">Install on iPhone</p>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Tap <span className="inline-flex items-center gap-0.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></span> Share button, then scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>
              </p>
            </div>
          )}

          {/* Flow Preview */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {['Find', 'Pick', 'Pay', 'Pass', 'Show', 'Go'].map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <span className="text-neutral-600 text-[10px] font-medium">{step}</span>
                {i < 5 && <span className="text-neutral-800 text-[8px]">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Features Strip */}
        <div className="grid grid-cols-3 gap-3 pt-8 pb-4">
          {[
            { icon: '⚡', label: 'Instant QR' },
            { icon: '🤝', label: 'Easy Transfer' },
            { icon: '🔒', label: 'Secure' },
          ].map(f => (
            <div key={f.label} className="text-center">
              <span className="text-lg">{f.icon}</span>
              <p className="text-neutral-500 text-[10px] mt-1">{f.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="text-center pt-4 border-t border-neutral-900">
          <p className="text-neutral-700 text-[10px]">Paper Plane UX · Jet Engine Backend</p>
        </div>
      </div>
    </div>
  );
}
