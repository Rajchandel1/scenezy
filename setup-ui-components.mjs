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

console.log('🎨 Setting up Complete UI Components Package...\n');

// =============================================
// 1. STATES COMPONENTS (Fixes the Build Error)
// =============================================
createFile('src/shared/components/ui/States.tsx', `
'use client';

import Link from 'next/link';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={\`animate-pulse bg-neutral-800/80 rounded-lg \${className}\`} />;
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
    <svg className={\`\${sizes[size]} animate-spin text-[#c4f000]\`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
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
// 4. REUSABLE SEARCH FILTER HOOK
// =============================================
createFile('src/shared/hooks/useSearchFilter.ts', `
import { useState, useMemo, useCallback } from 'react';

interface UseSearchFilterOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterField?: keyof T;
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return typeof value === 'string' && value.toLowerCase().includes(query);
        })
      );
    }

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
// DONE
// =============================================
console.log('\\n✅ All UI components created successfully!');
console.log('   • States.tsx (Skeletons, Empty, Error, Loading)');
console.log('   • SearchBar.tsx');
console.log('   • FilterTabs.tsx');
console.log('   • useSearchFilter.ts hook');
console.log('');
console.log('   Build error should be fixed now. Run npm run dev! 🚀');