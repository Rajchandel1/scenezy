'use client';

import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePWAInstall } from '@/shared/lib/use-pwa';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(setUser);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) setShowIOSHint(true);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
    router.refresh();
  };

  const handleInstall = async () => {
    if (canInstall) await install();
    else setShowIOSHint(true);
  };

  return (
    <div className="px-4 pt-6 space-y-6">
      <div><h1 className="text-white text-xl font-bold">Profile</h1></div>

      {/* User Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#c4f000] flex items-center justify-center">
            <span className="text-black font-bold text-lg">{user?.name?.[0] || '?'}</span>
          </div>
          <div>
            <p className="text-white font-semibold">{user?.name || 'Loading...'}</p>
            <p className="text-neutral-500 text-xs">{user?.email || ''}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-wider bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-lg font-medium">{user?.role || 'USER'}</span>
        </div>
      </div>

      {/* 🔥 INSTALL APP - Highlighted Section */}
      {!isInstalled && (
        <div className="bg-gradient-to-br from-[#c4f000]/10 to-neutral-900 border border-[#c4f000]/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c4f000] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-black font-black text-sm">P</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Install Scenezy App</p>
              <p className="text-neutral-400 text-[11px]">Quick access from your home screen</p>
            </div>
          </div>
          
          <button onClick={handleInstall}
            className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Install Now
          </button>

          {showIOSHint && !canInstall && (
            <p className="text-neutral-500 text-[10px] leading-relaxed">
              On iPhone: Tap Share → "Add to Home Screen"
            </p>
          )}
        </div>
      )}

      {isInstalled && (
        <div className="bg-green-950/20 border border-green-900/30 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span className="text-green-400 text-xs font-medium">App installed</span>
        </div>
      )}

      {/* Menu Items */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <Link href="/scanner" className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-800/50 transition-colors border-b border-neutral-800">
          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          <span className="text-neutral-300 text-sm">QR Scanner</span>
        </Link>
        {[
          { label: 'Booking History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { label: 'Help & Support', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((item, i) => (
          <button key={i} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-800/50 transition-colors border-b border-neutral-800 last:border-0">
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} /></svg>
            <span className="text-neutral-300 text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <button onClick={handleLogout} className="w-full bg-neutral-900 border border-red-900/30 text-red-400 font-medium py-3.5 rounded-xl transition-all active:scale-[0.98]">
        Logout
      </button>

      <p className="text-center text-neutral-700 text-[10px]">Scenezy v0.3.0 · Paper Plane UX</p>
    </div>
  );
}
