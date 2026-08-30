'use client';

import Link from 'next/link';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-block rounded-xl ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="surface rounded-3xl overflow-hidden">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
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
    <div className="surface ticket-cutout rounded-[1.75rem] overflow-hidden">
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-4 ticket-rule flex justify-between">
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

export function DashboardSkeleton() {
  return <div className="px-4 py-7 space-y-7" aria-label="Loading dashboard">
    <div className="space-y-3"><Skeleton className="h-3 w-24"/><Skeleton className="h-8 w-56"/><Skeleton className="h-4 w-72 max-w-full"/></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="surface rounded-2xl p-4 space-y-4"><Skeleton className="w-10 h-10"/><Skeleton className="h-6 w-16"/><Skeleton className="h-3 w-24"/></div>)}</div>
    <div className="grid md:grid-cols-2 gap-4">{Array.from({length:2}).map((_,i)=><div key={i} className="surface rounded-3xl p-5 space-y-4"><Skeleton className="h-5 w-40"/>{Array.from({length:3}).map((__,j)=><div key={j} className="flex gap-3"><Skeleton className="w-11 h-11 shrink-0"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3"/><Skeleton className="h-3 w-1/2"/></div></div>)}</div>)}</div>
  </div>;
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
    <div role="status" aria-live="polite" className="min-h-[45vh] flex flex-col items-center justify-center py-16 space-y-5">
      <div className="relative w-32 h-20 rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden shadow-xl">
        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--canvas)]"/><div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--canvas)]"/>
        <div className="absolute inset-x-4 top-4 flex items-center justify-between"><span className="text-[8px] text-blue-500 font-black tracking-[.2em]">SCENEZY</span><span className="w-5 h-2 rounded-sm bg-blue-600/80"/></div>
        <div className="absolute left-4 right-4 top-9 border-t border-dashed border-[var(--line)]"/>
        <div className="absolute left-4 right-4 bottom-3 h-5 flex gap-1 items-stretch">{[2,1,3,1,2,1,3,2,1,2,3].map((width,index)=><span key={index} className="bg-[var(--ink)] opacity-65" style={{width}}/>)}</div>
        <div className="ticket-scan-line absolute left-3 right-3 top-1 h-px bg-blue-500 shadow-[0_0_10px_2px_rgba(49,88,212,.65)]"/>
      </div>
      <div className="text-center"><p className="display-serif text-lg text-[var(--ink)]">Preparing your pass</p><p className="muted text-xs mt-1">{message}</p></div>
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
        className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
        {actionLabel}
      </Link>
    ) : (
      <button onClick={actionOnClick}
        className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] text-sm">
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

export function Spinner({ size = 'sm', className = 'text-blue-500' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4 gap-[2px]', md: 'w-6 h-5 gap-[3px]', lg: 'w-8 h-6 gap-1' };
  return <span role="status" aria-label="Loading" className={`${sizes[size]} inline-flex items-center justify-center ${className}`}>{[0,1,2,3].map(item=><span key={item} className="loader-bar h-full w-[2px] rounded-full bg-current"/>)}</span>;
}
