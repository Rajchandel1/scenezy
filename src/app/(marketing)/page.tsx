'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowUpRight, Download, Share2 } from 'lucide-react';
import { PassLogo } from '@/shared/components/branding/PassLogo';
import { usePWAInstall } from '@/shared/lib/use-pwa';
import { PublicFooter } from '@/shared/components/legal/PublicFooter';

type PublicEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  passes: Array<{ price: number; available: number }>;
};

/* Deterministic pseudo-QR — SSR-safe */
const QR_CELLS = (() => {
  let s = 42;
  const cells: boolean[] = [];
  for (let i = 0; i < 81; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    cells.push((s >> 16) % 100 > 44);
  }
  return cells;
})();

const delay = (ms: number): CSSProperties => ({ '--d': `${ms}ms` } as CSSProperties);

function useRevealOnScroll(deps: unknown[] = []) {
  const root = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const targets = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach(t => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return root;
}

export default function LandingPage() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [liveEvents, setLiveEvents] = useState<PublicEvent[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const pageRef = useRevealOnScroll([liveEvents]);

  const progressRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS/.test(navigator.userAgent);
    if (isIOS && isSafari && !isInstalled) setShowIOSHint(true);
  }, [isInstalled]);

  useEffect(() => {
    fetch('/api/data/content')
      .then(async response => (response.ok ? response.json() : null))
      .then(data =>
        setLiveEvents(
          (data?.events || [])
            .filter((event: PublicEvent) => event.passes?.some(pass => pass.available > 0))
            .slice(0, 4),
        ),
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* hero background — slow parallax */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      const el = heroBgRef.current;
      if (el) {
        const p = window.scrollY / window.innerHeight;
        el.style.transform = `translateY(${(p * 90).toFixed(1)}px) scale(1.12)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* glass pass — gentle pointer tilt + reflection */
  const onTilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const card = tiltRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.background = `radial-gradient(300px circle at ${((px + 0.5) * 100).toFixed(1)}% ${((py + 0.5) * 100).toFixed(1)}%, rgba(255,255,255,.12), transparent 60%)`;
    }
  };
  const resetTilt = () => {
    if (tiltRef.current) tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  const handleInstall = async () => {
    if (canInstall) await install();
    else if (!showIOSHint) setShowIOSHint(true);
  };

  return (
    <main
      ref={el => {
        pageRef.current = el;
      }}
      data-theme="dark"
      className="scenezy-page dark relative min-h-[100svh] overflow-x-hidden bg-[#030510] text-white [--ease:cubic-bezier(.22,1,.36,1)] [--royal:#2b4dff] [--royal-soft:#8fa4ff]"
      style={{ colorScheme: 'dark' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

        /* ── THEME LOCK: always dark, white text ── */
        .scenezy-page { color-scheme: dark; color: #ffffff; }
        .scenezy-page ::selection { background: #2b4dff; color: #fff; }

        .font-display { font-family: 'Instrument Serif', ui-serif, Georgia, 'Times New Roman', serif; }

        /* ── glass surfaces ── */
        .glass {
          background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.028));
          border: 1px solid rgba(255,255,255,.1);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.09), 0 30px 60px -32px rgba(0,0,0,.65);
        }
        .glass-interactive { transition: border-color .4s var(--ease, cubic-bezier(.22,1,.36,1)), background .4s var(--ease, cubic-bezier(.22,1,.36,1)), transform .4s var(--ease, cubic-bezier(.22,1,.36,1)); }
        .glass-interactive:hover { border-color: rgba(143,164,255,.35); background: linear-gradient(180deg, rgba(255,255,255,.095), rgba(255,255,255,.04)); }

        /* headline line reveal */
        .line-mask { display: block; overflow: hidden; padding-bottom: .06em; margin-bottom: -.06em; }
        .line-mask > span { display: block; transform: translateY(112%); animation: line-up 1.1s var(--ease, cubic-bezier(.22,1,.36,1)) forwards; animation-delay: var(--d, 0ms); }
        @keyframes line-up { to { transform: translateY(0); } }

        .fade-up { opacity: 0; animation: fade-up 1s var(--ease, cubic-bezier(.22,1,.36,1)) forwards; animation-delay: var(--d, 0ms); }
        @keyframes fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity .8s var(--ease, cubic-bezier(.22,1,.36,1)), transform .8s var(--ease, cubic-bezier(.22,1,.36,1)); transition-delay: var(--d, 0ms); }
        [data-reveal].is-in { opacity: 1; transform: translateY(0); }

        .u-reveal { position: relative; }
        .u-reveal::after { content: ''; position: absolute; left: 0; bottom: -3px; height: 1px; width: 100%; background: currentColor; transform: scaleX(0); transform-origin: right; transition: transform .45s var(--ease, cubic-bezier(.22,1,.36,1)); }
        .u-reveal:hover::after, .u-reveal:focus-visible::after { transform: scaleX(1); transform-origin: left; }

        @keyframes float-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-y { animation: float-y 7s ease-in-out infinite; }

        @keyframes live-pulse { 0% { box-shadow: 0 0 0 0 rgba(43,77,255,.5); } 70%, 100% { box-shadow: 0 0 0 7px rgba(43,77,255,0); } }
        .live-dot { animation: live-pulse 2.4s ease-out infinite; }

        .hint-in { animation: hint-in .45s var(--ease, cubic-bezier(.22,1,.36,1)) both; }
        @keyframes hint-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── FOOTER LOCK: links & text always white ── */
        .scenezy-footer-lock { color: #fff; }
        .scenezy-footer-lock :where(p, span, li, small, strong, em, h1, h2, h3, h4, h5, h6, div) { color: inherit; }
        .scenezy-footer-lock a, .scenezy-footer-lock a:visited { color: rgba(255,255,255,.82) !important; text-decoration-color: rgba(255,255,255,.35); }
        .scenezy-footer-lock a:hover { color: #fff !important; }
        .scenezy-footer-lock [class*="text-black"]:not(svg):not(path) { color: #fff !important; }

        @media (prefers-reduced-motion: reduce) {
          .line-mask > span, .fade-up, [data-reveal] { opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important; }
          .float-y, .live-dot, .hint-in { animation: none !important; }
        }
      `}</style>

      {/* royal-blue reading progress */}
      <div className="fixed inset-x-0 top-0 z-[70] h-[2px]">
        <div ref={progressRef} className="h-full w-full origin-left bg-gradient-to-r from-[#2b4dff] to-[#8fa4ff]" style={{ transform: 'scaleX(0)' }} />
      </div>

      {/* ── nav: glass pill bar ── */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${isScrolled ? 'pt-3' : 'pt-5'}`}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className={`glass mx-auto flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5 ${isScrolled ? 'max-w-3xl' : 'max-w-6xl'}`}>
            <Link href="/" className="group flex items-center gap-2.5">
              <PassLogo className="h-8 w-8 rounded-full transition-transform duration-500 group-hover:rotate-12" />
              <span className="text-sm font-semibold tracking-tight">Scenezy</span>
            </Link>
            <Link
              href="/sign-in"
              className="rounded-xl border border-white/15 bg-white/[.05] px-4 py-1.5 text-sm font-medium text-white/90 transition-all duration-300 hover:border-white/60 hover:bg-white hover:text-[#030510] active:scale-95"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════ HERO — full background image ══════════ */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden">
        {/* background image + parallax */}
        <div className="absolute -inset-y-16 inset-x-0 will-change-transform" ref={heroBgRef}>
          <Image
            src="/scenezy-welcome-events.png"
            alt="A world of concerts, comedy, sports and cultural events"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* readability layers */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,16,.82)_0%,rgba(3,5,16,.45)_48%,rgba(3,5,16,.15)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,5,16,.35)_0%,rgba(3,5,16,.1)_38%,rgba(3,5,16,.6)_74%,#030510_96%)]" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(900px_500px_at_78%_18%,rgba(43,77,255,.14),transparent_60%)]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:pt-40">
          {/* left — copy */}
          <div>
            <div className="fade-up glass inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.28em] text-[#8fa4ff]" style={delay(0)}>
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#4c6bff]" />
              Your next moment
            </div>

            <h1 className="mt-7 text-[clamp(2.7rem,8.5vw,5.4rem)] font-black leading-[.95] tracking-[-.045em] [text-wrap:balance]">
              <span className="line-mask" style={delay(140)}>
                <span>Don&apos;t just hear</span>
              </span>
              <span className="line-mask" style={delay(280)}>
                <span>
                  about it.{' '}
                  <em className="font-display font-normal italic tracking-[-.02em] text-[#8fa4ff]">Be there.</em>
                </span>
              </span>
            </h1>

            <p className="fade-up mt-6 max-w-md text-[15px] leading-7 text-white/60" style={delay(440)}>
              Discover live experiences, book in seconds, and keep every pass ready at the door.
            </p>

            <div className="fade-up mt-8" style={delay(560)}>
              <button
                type="button"
                onClick={handleInstall}
                disabled={isInstalled}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-[#2b4dff] px-8 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-18px_rgba(43,77,255,.75),inset_0_1px_0_rgba(255,255,255,.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d5cff] active:scale-[.98] disabled:cursor-default disabled:opacity-50 sm:px-10"
              >
                <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                {isInstalled ? 'Scenezy is installed' : 'Install the app'}
              </button>
            </div>

            {showIOSHint && !isInstalled && (
              <div className="hint-in glass mt-4 max-w-md rounded-2xl p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="h-4 w-4 text-[#8fa4ff]" /> Install on iPhone
                </p>
                <p className="mt-1 pl-6 text-xs leading-5 text-white/55">
                  Tap Share in Safari, then choose <span className="text-white/90">Add to Home Screen</span>.
                </p>
              </div>
            )}
          </div>

          {/* right — glass pass */}
          <div className="fade-up relative" style={delay(520)}>
            <div className="[perspective:1300px]">
              <div className="float-y">
                <div
                  ref={tiltRef}
                  onPointerMove={onTilt}
                  onPointerLeave={resetTilt}
                  className="glass relative overflow-hidden rounded-[1.6rem] p-6 transition-transform duration-300 will-change-transform"
                >
                  <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#4c6bff]/70 to-transparent" />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <PassLogo className="h-10 w-10 rounded-full" />
                      <div>
                        <p className="text-sm font-bold tracking-[.18em]">SCENEZY</p>
                        <p className="font-mono text-[9px] tracking-[.3em] text-white/35">OFFICIAL ENTRY PASS</p>
                      </div>
                    </div>
                    <p className="rounded-full border border-[#2b4dff]/40 bg-[#2b4dff]/15 px-2.5 py-1 font-mono text-[9px] tracking-[.2em] text-[#8fa4ff]">N° 001247</p>
                  </div>

                  <div className="mt-9">
                    <p className="font-mono text-[10px] tracking-[.3em] text-[#8fa4ff]">LIVE · TONIGHT</p>
                    <p className="font-display mt-2 text-[2rem] italic leading-tight">Your seat is ready.</p>
                    <p className="mt-3 font-mono text-[10px] tracking-[.25em] text-white/40">
                      FRI · 21:30 IST <span className="mx-1.5 text-white/20">·</span> GATE 04
                    </p>
                  </div>

                  {/* perforation + notches */}
                  <div className="relative mt-7 border-t border-dashed border-white/15">
                    <span className="absolute -left-9 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#030510]" />
                    <span className="absolute -right-9 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#030510]" />
                  </div>

                  <div className="mt-6 flex items-center gap-5">
                    <div className="rounded-xl bg-white p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                      <div className="grid grid-cols-9 gap-[2px]">
                        {QR_CELLS.map((on, i) => (
                          <span key={i} className={`h-[7px] w-[7px] rounded-[1px] ${on ? 'bg-[#0a1128]' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div
                        className="h-7 w-28 opacity-80"
                        style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,.85) 0 2px,transparent 2px 4px,rgba(255,255,255,.85) 4px 5px,transparent 5px 9px,rgba(255,255,255,.85) 9px 12px,transparent 12px 14px)' }}
                      />
                      <p className="mt-2.5 font-mono text-[9px] tracking-[.3em] text-white/40">SCAN AT ENTRY</p>
                      <p className="mt-1 text-[10px] font-bold tracking-[.35em] text-[#8fa4ff]">ADMIT ONE</p>
                    </div>
                  </div>

                  <div ref={glareRef} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 02 — ON SALE ══════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.3em] text-[#8fa4ff]">02 — On sale now</p>
            <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl [text-wrap:balance]">
              Tickets available now
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-5 text-white/45">
            Each event displays its ticket price before booking. A 5% platform fee and the final payable total are shown before payment.
          </p>
        </div>

        {liveEvents.length > 0 ? (
          <div className="mt-10 space-y-3">
            {liveEvents.map((event, i) => {
              const prices = event.passes.filter(pass => pass.available > 0).map(pass => pass.price);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  data-reveal
                  style={delay(i * 80)}
                  className="glass glass-interactive group grid grid-cols-[2.2rem_1fr_auto] items-center gap-4 rounded-2xl p-5 hover:-translate-y-0.5 sm:grid-cols-[3rem_1fr_auto_2.5rem] sm:gap-6 sm:p-6"
                >
                  <span className="font-mono text-xs text-[#8fa4ff]/60 transition-colors duration-300 group-hover:text-[#8fa4ff]">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-1.5">{event.title}</span>
                    <span className="mt-1 block truncate font-mono text-[11px] uppercase tracking-[.16em] text-white/40">
                      {event.location} · {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="font-display text-xl italic sm:text-2xl">₹{Math.min(...prices).toLocaleString('en-IN')}</span>
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[.25em] text-[#8fa4ff]/60">From</span>
                  </span>
                  <span className="hidden h-10 w-10 place-items-center rounded-full border border-white/15 transition-all duration-300 group-hover:border-[#4c6bff]/70 group-hover:bg-[#2b4dff]/20 sm:grid">
                    <ArrowUpRight className="h-4 w-4 -translate-x-0.5 translate-y-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div data-reveal style={delay(140)} className="glass mt-10 rounded-2xl p-6">
            <p className="font-semibold">Live event pricing</p>
            <p className="mt-1.5 max-w-lg text-sm leading-6 text-white/45">
              Open any active event to see available pass types and current prices in INR. The complete payable amount is confirmed before checkout.
            </p>
          </div>
        )}
      </section>

      {/* ══════════ 03 — HOW IT WORKS ══════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 sm:pb-32">
        <div data-reveal>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.3em] text-[#8fa4ff]">03 — How it works</p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl [text-wrap:balance]">
            Your ticket, delivered in seconds
          </h2>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ['01', 'Choose & pay', 'Select an available pass. Pricing, quantity, fee and final total remain visible before payment.'],
            ['02', 'Payment verified', 'Your booking is confirmed only after the payment gateway reports a successful payment.'],
            ['03', 'Pass delivered', 'The digital ticket and entry QR appear in My Passes. Present that QR at the event entrance.'],
          ].map(([number, title, copy], i) => (
            <div key={number} data-reveal style={delay(i * 100)} className="glass glass-interactive group rounded-2xl p-6 hover:-translate-y-1">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2b4dff]/40 bg-[#2b4dff]/15 font-mono text-xs text-[#8fa4ff] transition-all duration-500 group-hover:border-[#4c6bff] group-hover:bg-[#2b4dff]/35">
                {number}
              </span>
              <h3 className="mt-12 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2.5 text-[13px] leading-6 text-white/45">{copy}</p>
            </div>
          ))}
        </div>

        <p data-reveal style={delay(200)} className="mt-8 text-xs leading-5 text-white/40">
          Paid but cannot see your ticket? Check Orders first, then{' '}
          <Link href="/contact" className="u-reveal text-white/80 transition-colors hover:text-white">contact Scenezy</Link>{' '}
          with your order ID.
        </p>
      </section>

      {/* ══════════ 04 — GET THE APP ══════════ */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div data-reveal className="glass relative overflow-hidden rounded-[1.75rem] p-8 sm:p-12">
          <span aria-hidden className="pointer-events-none absolute -bottom-8 -right-3 select-none font-display text-[7rem] italic leading-none text-white/[.05] sm:text-[9rem]">
            Scenezy
          </span>
          <span aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#4c6bff]/60 to-transparent" />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.3em] text-[#8fa4ff]">04 — Get the app</p>
              <p className="font-display mt-5 text-3xl italic leading-tight sm:text-[2.5rem]">
                Every pass, one tap away — even at the gate.
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                Install Scenezy on your home screen. Your QR passes open instantly — no queue, no screenshots.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <button
                type="button"
                onClick={handleInstall}
                disabled={isInstalled}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-[#2b4dff] px-8 py-4 text-sm font-bold text-white shadow-[0_18px_50px_-18px_rgba(43,77,255,.75),inset_0_1px_0_rgba(255,255,255,.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d5cff] active:scale-[.98] disabled:cursor-default disabled:opacity-50"
              >
                <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                {isInstalled ? 'Scenezy is installed' : 'Install the app'}
              </button>
              <p className="font-mono text-[9px] uppercase tracking-[.3em] text-white/35">Free · iOS & Android</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── footer (theme-locked) ── */}
      <div className="scenezy-footer-lock relative border-t border-white/10 bg-[#02040c]">
        <PublicFooter />
      </div>
    </main>
  );
}