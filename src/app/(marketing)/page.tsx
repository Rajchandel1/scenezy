'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Download, Share2 } from 'lucide-react';
import { PassLogo } from '@/shared/components/branding/PassLogo';
import { usePWAInstall } from '@/shared/lib/use-pwa';

export default function LandingPage() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent);
    if (isIOS && isSafari && !isInstalled) setShowIOSHint(true);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (canInstall) await install();
    else if (!showIOSHint) setShowIOSHint(true);
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-x-0 top-0 h-[72svh] min-h-[31rem]">
        <Image
          src="/scenezy-welcome-events.png"
          alt="A world of concerts, comedy, sports and cultural events"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-cover object-top opacity-95"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,10,.06)_0%,rgba(2,4,10,.02)_42%,#02040a_91%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_30%,rgba(2,4,10,.38)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/30 py-1.5 pl-1.5 pr-4 backdrop-blur-xl">
            <PassLogo className="h-9 w-9 rounded-full" />
            <span className="text-sm font-semibold tracking-tight">Scenezy</span>
          </div>
          <Link href="/sign-in" className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-xl transition hover:bg-white hover:text-black active:scale-95">
            Sign in
          </Link>
        </header>

        <div className="flex-1" />

        <section className="relative text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-blue-300">
            <span className="h-px w-7 bg-blue-400/70" />
            Your next moment
            <span className="h-px w-7 bg-blue-400/70" />
          </div>
          <h1 className="text-[2.4rem] font-black leading-[.94] tracking-[-.055em] sm:text-5xl">
            Don&apos;t just hear about it.
            <span className="mt-1 block text-[#4f7cff]">Be there.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/55 sm:text-base">
            Discover live experiences, book in seconds, and keep every pass ready at the door.
          </p>
        </section>

        <div className="mt-6 space-y-3">
          <Link href="/sign-up" className="group flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-white py-4 text-base font-bold text-black shadow-[0_14px_45px_rgba(37,99,235,.22)] transition hover:bg-blue-50 active:scale-[.985]">
            Explore Scenezy
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button type="button" onClick={handleInstall} disabled={isInstalled} className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-white/10 bg-white/[.07] py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[.12] active:scale-[.985] disabled:cursor-default disabled:opacity-50">
            <Download className="h-4 w-4" />
            {isInstalled ? 'Scenezy is installed' : 'Install the app'}
          </button>
        </div>

        {showIOSHint && !isInstalled && (
          <div className="mt-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3.5 text-left backdrop-blur-xl">
            <p className="flex items-center gap-2 text-sm font-semibold"><Share2 className="h-4 w-4 text-blue-300" /> Install on iPhone</p>
            <p className="mt-1 pl-6 text-xs leading-5 text-white/55">
              Tap Share in Safari, then choose <span className="text-white/90">Add to Home Screen</span>.
            </p>
          </div>
        )}

        <p className="mt-4 text-center text-[10px] uppercase tracking-[.2em] text-white/30">Discover · Book · Enter</p>
      </div>
    </main>
  );
}
