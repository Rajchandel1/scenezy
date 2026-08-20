'use client';

import { useEffect, useState, useCallback } from 'react';
import { authService } from '@/features/auth';
import { StatCardSkeleton, EventCardSkeleton, EmptyState, ErrorState, PageLoading } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';

interface SellerEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  totalSold: number;
  revenue: number;
  sellPercentage: number;
}

const eventStatusFilters = [
  { id: 'all', label: 'All Events' },
  { id: 'ACTIVE', label: 'Live' },
  { id: 'PENDING_APPROVAL', label: 'Pending' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function SellerDashboardPage() {
  const [events, setEvents] = useState<SellerEvent[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const [dashRes, eventsRes] = await Promise.all([
        fetch(`/api/data/seller?action=dashboard&sellerId=${user.id}`),
        fetch(`/api/data/seller?action=events&sellerId=${user.id}`)
      ]);

      if (!dashRes.ok || !eventsRes.ok) throw new Error('Failed to load seller data');
      setDashboard(await dashRes.json());
      setEvents(await eventsRes.json());
    } catch (err) {
      setError('Could not load seller dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const {
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    filteredData, clearFilters, hasActiveFilters,
    filteredCount, totalCount
  } = useSearchFilter<SellerEvent>({
    data: events,
    searchFields: ['title'],
    filterField: 'status',
  });

  const noResults = !loading && !error && filteredData.length === 0;

  if (loading) return <PageLoading message="Loading seller dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">Seller Dashboard</h1>
      </div>

      {/* Quick Stats */}
      {dashboard?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue', value: `₹${dashboard.overview.totalRevenue}`, color: 'text-[#c4f000]' },
            { label: 'Tickets Sold', value: dashboard.overview.totalSold, color: 'text-blue-400' },
            { label: 'Active Events', value: dashboard.overview.activeCount, color: 'text-green-400' },
            { label: 'Pending Approval', value: dashboard.overview.pendingCount, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Your Events</h2>
          <span className="text-neutral-500 text-xs">{hasActiveFilters ? `${filteredCount}/${totalCount}` : totalCount} events</span>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search your events..." />
        <FilterTabs tabs={eventStatusFilters} activeTab={activeFilter} onTabChange={setActiveFilter} />

        {noResults ? (
          <EmptyState
            icon=""
            title={hasActiveFilters ? "No matching events" : "No events created"}
            description={hasActiveFilters ? "Adjust filters" : "Create your first event to start selling"}
            actionLabel={hasActiveFilters ? "Clear Filters" : "Create Event"}
            actionOnClick={hasActiveFilters ? clearFilters : undefined}
            actionHref={!hasActiveFilters ? "/seller/events/new" : undefined}
          />
        ) : (
          <div className="space-y-4">
            {filteredData.map(event => (
              <div key={event.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:border-neutral-700 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-white font-semibold text-base">{event.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shrink-0 ${
                    event.status === 'ACTIVE' ? 'bg-green-950/30 text-green-400 border-green-900/50' :
                    event.status === 'PENDING_APPROVAL' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-900/50' :
                    'bg-red-950/30 text-red-400 border-red-900/50'
                  }`}>
                    {event.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <div className="flex items-center gap-3">
                    <span>{event.totalSold} sold</span>
                    <span className="text-[#c4f000] font-medium">₹{event.revenue}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#c4f000] rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(event.sellPercentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
