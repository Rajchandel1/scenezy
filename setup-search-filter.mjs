import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFile(filepath, content) {
  const fullPath = join(__dirname, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.trimStart(), 'utf-8');
  console.log(`  ✅ ${filepath}`);
}

console.log('🔍 Setting up Reusable Search & Filter Hook...\n');

// =============================================
// 1. REUSABLE SEARCH FILTER HOOK
// =============================================
createFile('src/shared/hooks/useSearchFilter.ts', `
import { useState, useMemo, useCallback } from 'react';

interface UseSearchFilterOptions<T> {
  data: T[];
  searchFields?: (keyof T)[]; // Fields to search in
  filterField?: keyof T;      // Field to filter by (e.g., category, status)
}

export function useSearchFilter<T extends Record<string, any>>({
  data,
  searchFields = ['title', 'name', 'email'],
  filterField,
}: UseSearchFilterOptions<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return typeof value === 'string' && value.toLowerCase().includes(query);
        })
      );
    }

    // Apply category/status filter
    if (filterField && activeFilter !== 'all') {
      result = result.filter(item => item[filterField] === activeFilter);
    }

    return result;
  }, [data, searchQuery, activeFilter, searchFields, filterField]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || activeFilter !== 'all';

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredData,
    clearFilters,
    hasActiveFilters,
    totalCount: data.length,
    filteredCount: filteredData.length,
  };
}
`);

// =============================================
// 2. SEARCH BAR COMPONENT
// =============================================
createFile('src/shared/components/ui/SearchBar.tsx', `
'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={\`relative \${className}\`}>
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000]/30 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
`);

// =============================================
// 3. FILTER TABS COMPONENT
// =============================================
createFile('src/shared/components/ui/FilterTabs.tsx', `
'use client';

interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function FilterTabs({ tabs, activeTab, onTabChange, className = '' }: FilterTabsProps) {
  return (
    <div className={\`flex gap-2 overflow-x-auto pb-1 scrollbar-hide \${className}\`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={\`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 \${
            activeTab === tab.id
              ? 'bg-[#c4f000] text-black shadow-lg shadow-[#c4f000]/20'
              : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
          }\`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={\`text-[10px] px-1.5 py-0.5 rounded-full \${
              activeTab === tab.id ? 'bg-black/20' : 'bg-neutral-800'
            }\`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
`);

// =============================================
// 4. UPDATED HOME PAGE WITH SEARCH/FILTER HOOK
// =============================================
createFile('src/app/(dashboard)/home/page.tsx', `
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
      href={\`/events/\${event.id}\`} 
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
            {hasActiveFilters && \` (\${filteredCount}/\${totalCount})\`}
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
`);

// =============================================
// DONE
// =============================================
console.log('\\n✅ Search & Filter setup complete!');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('   📦 WHAT WAS CREATED:');
console.log('   ═══════════════════════════════════════════');
console.log('');
console.log('   1. useSearchFilter<T> Hook');
console.log('      • Reusable across ANY page');
console.log('      • Configurable search fields');
console.log('      • Configurable filter field');
console.log('      • Built-in clear/reset');
console.log('      • Returns counts for UI badges');
console.log('');
console.log('   2. SearchBar Component');
console.log('      • Clean dark theme design');
console.log('      • Clear button when typing');
console.log('      • Lime green focus ring');
console.log('');
console.log('   3. FilterTabs Component');
console.log('      • Horizontal scrollable tabs');
console.log('      • Active state with lime highlight');
console.log('      • Optional count badges');
console.log('');
console.log('   4. Updated Home Page');
console.log('      • Uses all 3 components above');
console.log('      • Shows filtered count in subtitle');
console.log('      • Proper empty states for filters');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('   🔄 HOW TO USE ON OTHER PAGES:');
console.log('   ═══════════════════════════════════════════');
console.log('');
