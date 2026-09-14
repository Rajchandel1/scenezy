'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { authService, type AuthUser } from '@/features/auth';
import { PassCardSkeleton, EmptyState, ErrorState } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';
import { useClientQuery } from '@/shared/hooks/useClientQuery';

interface Pass {
  id: string;
  eventTitle: string;
  passTypeName: string;
  status: string;
  eventDate: string;
  credential: string;
}

const statusFilters = [
  { id: 'all', label: 'All Passes' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'USED', label: 'Used' },
  { id: 'REVOKED', label: 'Revoked' },
];

function PassCard({ pass }: { pass: Pass }) {
  const dateObj = new Date(pass.eventDate);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-950/30 text-green-400 border-green-900/50',
    USED: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    REVOKED: 'bg-red-950/30 text-red-400 border-red-900/50',
  };

  return (
    <Link href={`/passes/${pass.id}`} className="ticket-paper block rounded-[1.75rem] overflow-hidden active:scale-[0.985] transition-all hover:-translate-y-0.5 group">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-[10px] uppercase tracking-[.2em] text-[#3158d4] font-bold mb-2">Scenezy access</p><h3 className="ticket-ink display-serif text-2xl leading-tight">{pass.eventTitle}</h3></div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusColors[pass.status] || statusColors.USED}`}>
            {pass.status}
          </span>
        </div>
        <p className="text-[#3158d4] text-sm font-semibold">{pass.passTypeName}</p>
        <div className="ticket-seam flex items-center justify-between pt-4 mt-5">
          <span className="ticket-muted text-xs flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {dateStr}
          </span>
          <span className="ticket-muted text-[10px] font-mono tracking-[.16em] truncate max-w-[140px]">{pass.credential.slice(0, 10)}</span>
        </div>
      </div>
    </Link>
  );
}

function PassesContent({ userId }: { userId: string }) {
  const fetchPasses = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || session.user.id !== userId) throw new Error('Not authenticated');
    const res = await fetch('/api/data/passes', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error('Could not load your passes.');
    return res.json() as Promise<Pass[]>;
  }, [userId]);
  const {data,loading,error,refresh}=useClientQuery({key:`private:passes:${userId}`,fetcher:fetchPasses,freshForMs:30_000,retainForMs:5*60_000});
  const passes=data||[];

  const {
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    filteredData, clearFilters, hasActiveFilters,
    filteredCount, totalCount
  } = useSearchFilter<Pass>({
    data: passes,
    searchFields: ['eventTitle', 'passTypeName', 'credential'],
    filterField: 'status',
  });

  const noResults = !loading && !error && filteredData.length === 0;

  return (
    <div className="px-4 pt-7 space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Digital wallet</p><h1 className="display-serif text-white text-4xl mt-1">Your passes</h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Your tickets · {hasActiveFilters ? `${filteredCount}/${totalCount}` : totalCount}
          </p>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events or pass ID..." />
      
      <FilterTabs tabs={statusFilters} activeTab={activeFilter} onTabChange={setActiveFilter} />

      {loading ? (
        <div className="space-y-4"><PassCardSkeleton /><PassCardSkeleton /><PassCardSkeleton /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={()=>void refresh()} />
      ) : noResults ? (
        <EmptyState
          icon="🎫"
          title={hasActiveFilters ? "No matching passes" : "No passes yet"}
          description={hasActiveFilters ? "Try adjusting filters" : "Buy a pass to see it here"}
          actionLabel={hasActiveFilters ? "Clear Filters" : "Explore Events"}
          actionOnClick={hasActiveFilters ? clearFilters : undefined}
          actionHref={!hasActiveFilters ? "/home" : undefined}
        />
      ) : (
        <div className="space-y-4">{filteredData.map(p => <PassCard key={p.id} pass={p} />)}</div>
      )}
    </div>
  );
}

export default function PassesPage() {
  const [user,setUser]=useState<AuthUser|null>(()=>authService.peekCurrentUser());
  useEffect(()=>{authService.getCurrentUser().then(setUser).catch(()=>setUser(null));},[]);
  if(!user)return <div className="px-4 pt-7 space-y-7"><div><p className="eyebrow">Digital wallet</p><h1 className="display-serif text-white text-4xl mt-1">Your passes</h1></div><PassCardSkeleton/><PassCardSkeleton/></div>;
  return <PassesContent userId={user.id}/>;
}
