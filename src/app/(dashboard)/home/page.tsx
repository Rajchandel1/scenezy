'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/shared/components/layout/NotificationBell';
import { EventCardSkeleton, EmptyState, ErrorState, PageLoading } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';

interface PassType { 
  id: string; 
  name: string; 
  price: number; 
  benefits: string; 
  available: number; 
  sold: number; 
  transferAllowed: boolean; 
}

interface Event { 
  id: string; 
  title: string; 
  description: string; 
  date: string; 
  time: string; 
  location: string; 
  venue: string; 
  category: string; 
  sellerName: string; 
  status: string; 
  passes: PassType[]; 
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'Party', label: 'Party' },
  { id: 'Music', label: 'Music' },
  { id: 'Conference', label: 'Conference' },
  { id: 'Comedy', label: 'Comedy' },
  { id: 'Business', label: 'Business' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Workshop', label: 'Workshop' },
];

function EventCard({ event }: { event: Event }) {
  const minPrice = Math.min(...event.passes.map(p => p.price));
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Link 
      href={`/events/${event.id}`} 
      className="block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200 hover:border-neutral-700"
    >
      <div className="h-36 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
        <span className="text-neutral-600 text-sm font-medium">{event.category}</span>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
          {dateStr} · {event.time}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-white font-semibold text-base leading-tight">{event.title}</h3>
        <p className="text-neutral-500 text-xs flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location} · {event.venue}</span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[#c4f000] font-bold text-sm">From ₹{minPrice}</span>
          <span className="text-neutral-400 text-xs bg-neutral-800 px-2.5 py-1 rounded-lg font-medium">GET PASS →</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/data/events');
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data.filter((e: Event) => e.status === 'ACTIVE'));
    } catch (err) {
      setError('Could not load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadEvents(); 
  }, [loadEvents]);

  // Use the reusable search/filter hook
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredData,
    clearFilters,
    hasActiveFilters,
    filteredCount,
    totalCount,
  } = useSearchFilter<Event>({
    data: events,
    searchFields: ['title', 'location', 'venue', 'description'],
    filterField: 'category',
  });

  const noResults = !loading && !error && filteredData.length === 0;

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Discover Events</h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Find · Pick · Pay · Pass · Show · Go
            {hasActiveFilters && ` (${filteredCount}/${totalCount})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
            <span className="text-[#c4f000] text-sm font-bold">P</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar 
        value={searchQuery} 
        onChange={setSearchQuery} 
        placeholder="Search events, city, or venue..." 
      />

      {/* Category Filter Tabs */}
      <FilterTabs 
        tabs={categories} 
        activeTab={activeFilter} 
        onTabChange={setActiveFilter} 
      />

      {/* Content States */}
      {loading ? (
        <div className="space-y-4">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : noResults ? (
        <EmptyState
          icon="🔍"
          title={hasActiveFilters ? "No matching events" : "No events yet"}
          description={
            hasActiveFilters 
              ? "Try adjusting your search or filters" 
              : "Events will appear here once sellers create them"
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : "Explore"}
          actionOnClick={hasActiveFilters ? clearFilters : undefined}
          actionHref={!hasActiveFilters ? "/explore" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredData.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
