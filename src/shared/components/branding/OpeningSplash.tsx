'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LogoVideoLoader } from './LogoVideoLoader';

const INTRO_KEY = 'scenezy_intro_seen_v1';

export function OpeningSplash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {}
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 240);
  }, []);

  useEffect(() => {
    if (!visible) return;
    try {
      if (sessionStorage.getItem(INTRO_KEY) === '1') {
        dismissed.current = true;
        setVisible(false);
        return;
      }
    } catch {}

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const fallback = window.setTimeout(dismiss, 12_000);

    return () => {
      window.clearTimeout(fallback);
      document.body.style.overflow = previousOverflow;
    };
  }, [dismiss, visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Opening Scenezy"
      className={`fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-black transition-opacity duration-200 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <LogoVideoLoader
        size="full"
        loop={false}
        playbackRate={1.3}
        onEnded={dismiss}
        onError={dismiss}
        className="h-full w-full bg-black px-4"
      />
    </div>
  );
}
