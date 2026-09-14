'use client';

import { PassLogo } from './PassLogo';

interface LogoVideoLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showText?: boolean;
  text?: string;
  loop?: boolean;
  playbackRate?: number;
  onEnded?: () => void;
  onError?: () => void;
}

export function LogoVideoLoader({
  className = '',
  size = 'lg',
  showText = false,
  text,
  loop = false,
  playbackRate = 1,
  onEnded,
  onError,
}: LogoVideoLoaderProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    full: 'w-[min(92vw,48rem)] aspect-video',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center overflow-hidden rounded-2xl`}>
        <video
          src="/scenezy-loader.mp4"
          autoPlay
          loop={loop}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={event => {
            event.currentTarget.defaultPlaybackRate = playbackRate;
            event.currentTarget.playbackRate = playbackRate;
          }}
          onEnded={onEnded}
          onError={onError}
          aria-label="Loading..."
          className="h-full w-full object-contain pointer-events-none"
        >
          <PassLogo className="w-16 h-16 animate-pulse" />
        </video>
      </div>
      {showText && text && (
        <p className="text-neutral-400 text-sm font-medium animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
}
