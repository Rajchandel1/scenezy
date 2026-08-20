'use client';

import Link from 'next/link';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-800/80 rounded-lg ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <Skeleton className="h-36 rounded-none" />
      <div className="p-4 space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function PassCardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="h-1.5 bg-neutral-800" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-2 border-t border-neutral-800 flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-6 w-12 mt-1.5" />
      <Skeleton className="h-2.5 w-10 mt-1" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-neutral-800/50">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 bg-[#c4f000] rounded-xl flex items-center justify-center animate-pulse">
        <span className="text-black font-black text-sm">P</span>
      </div>
      <p className="text-neutral-500 text-sm">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, actionHref, actionOnClick }: EmptyStateProps) {
  const ActionContent = actionLabel ? (
    actionHref ? (
      <Link href={actionHref}
        className="inline-block bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
        {actionLabel}
      </Link>
    ) : (
      <button onClick={actionOnClick}
        className="inline-block bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
        {actionLabel}
      </button>
    )
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 space-y-4 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
        {icon ? (
          <span className="text-3xl">{icon}</span>
        ) : (
          <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-white font-semibold text-base">{title}</p>
        <p className="text-neutral-500 text-sm max-w-[250px] leading-relaxed">{description}</p>
      </div>
      {ActionContent && <div className="pt-2">{ActionContent}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-white font-medium text-sm">{message}</p>
        <p className="text-neutral-600 text-xs">Please try again</p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] text-sm hover:border-neutral-700">
          Try Again
        </button>
      )}
    </div>
  );
}

export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg className={`${sizes[size]} animate-spin text-[#c4f000]`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
