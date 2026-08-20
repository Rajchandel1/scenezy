'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth';
import { PassCardSkeleton, EmptyState, ErrorState, PageLoading } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';

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
    <Link href={`/passes/${pass.id}`} className="block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all hover:border-neutral-700">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-base leading-tight">{pass.eventTitle}</h3>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusColors[pass.status] || statusColors.USED}`}>
            {pass.status}
          </span>
        </div>
        <p className="text-[#c4f000] text-sm font-medium">{pass.passTypeName}</p>
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <span className="text-neutral-500 text-xs flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {dateStr}
          </span>
          <span className="text-neutral-600 text-[10px] font-mono truncate max-w-[120px]">{pass.credential.slice(0, 8)}...</span>
        </div>
      </div>
    </Link>
  );
}

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      
      const res = await fetch(`/api/data/passes?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to load passes');
      setPasses(await res.json());
    } catch (err) {
      setError('Could not load your passes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPasses(); }, [loadPasses]);

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
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">My Passes</h1>
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
        <ErrorState message={error} onRetry={loadPasses} />
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
