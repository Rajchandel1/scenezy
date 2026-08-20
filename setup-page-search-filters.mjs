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

console.log('🔍 Adding Search/Filter to Passes, Admin & Seller Pages...\n');

// =============================================
// 1. PASSES PAGE (User Wallet)
// =============================================
createFile('src/app/(dashboard)/passes/page.tsx', `
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
    <Link href={\`/passes/\${pass.id}\`} className="block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all hover:border-neutral-700">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-base leading-tight">{pass.eventTitle}</h3>
          <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 \${statusColors[pass.status] || statusColors.USED}\`}>
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
      
      const res = await fetch(\`/api/data/passes?userId=\${user.id}\`);
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
            Your tickets · {hasActiveFilters ? \`\${filteredCount}/\${totalCount}\` : totalCount}
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
`);

// =============================================
// 2. ADMIN DASHBOARD (Users/Events Management)
// =============================================
createFile('src/app/(admin)/admin/page.tsx', `
'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCardSkeleton, ListRowSkeleton, EmptyState, ErrorState, PageLoading } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useSearchFilter } from '@/shared/hooks/useSearchFilter';

interface User { id: string; name: string; email: string; role: string; approved?: boolean; suspended?: boolean; createdAt: string; }

const roleFilters = [
  { id: 'all', label: 'All Users' },
  { id: 'USER', label: 'Users' },
  { id: 'SELLER', label: 'Sellers' },
  { id: 'ADMIN', label: 'Admins' },
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/data/admin?action=users'),
        fetch('/api/data/admin?action=stats')
      ]);
      if (!usersRes.ok || !statsRes.ok) throw new Error('Failed to load admin data');
      setUsers(await usersRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      setError('Could not load dashboard data.');
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
  } = useSearchFilter<User>({
    data: users,
    searchFields: ['name', 'email'],
    filterField: 'role',
  });

  const noResults = !loading && !error && filteredData.length === 0;

  if (loading) return <PageLoading message="Loading admin dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: stats.totalUsers, color: 'text-[#c4f000]' },
            { label: 'Pending Sellers', value: stats.pendingSellers, color: 'text-yellow-400' },
            { label: 'Active Events', value: stats.activeEvents, color: 'text-blue-400' },
            { label: 'Total Revenue', value: \`₹\${stats.totalRevenue}\`, color: 'text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">{stat.label}</p>
              <p className={\`text-lg font-bold mt-1 \${stat.color}\`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Users Management</h2>
          <span className="text-neutral-500 text-xs">{hasActiveFilters ? \`\${filteredCount}/\${totalCount}\` : totalCount} users</span>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or email..." />
        <FilterTabs tabs={roleFilters} activeTab={activeFilter} onTabChange={setActiveFilter} />

        {noResults ? (
          <EmptyState
            icon="👥"
            title={hasActiveFilters ? "No matching users" : "No users found"}
            description={hasActiveFilters ? "Adjust your search or filters" : "Users will appear here after signup"}
            actionLabel={hasActiveFilters ? "Clear Filters" : undefined}
            actionOnClick={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/50">
            {filteredData.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-neutral-800/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#c4f000]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#c4f000] text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.name}</p>
                  <p className="text-neutral-500 text-xs truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {user.role}
                  </span>
                  {user.role === 'SELLER' && !user.approved && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-yellow-950/30 text-yellow-400 border border-yellow-900/50">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`);

// =============================================
// 3. SELLER DASHBOARD (Events Analytics)
// =============================================
createFile('src/app/(seller)/seller/page.tsx', `
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
        fetch(\`/api/data/seller?action=dashboard&sellerId=\${user.id}\`),
        fetch(\`/api/data/seller?action=events&sellerId=\${user.id}\`)
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
            { label: 'Total Revenue', value: \`₹\${dashboard.overview.totalRevenue}\`, color: 'text-[#c4f000]' },
            { label: 'Tickets Sold', value: dashboard.overview.totalSold, color: 'text-blue-400' },
            { label: 'Active Events', value: dashboard.overview.activeCount, color: 'text-green-400' },
            { label: 'Pending Approval', value: dashboard.overview.pendingCount, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">{stat.label}</p>
              <p className={\`text-lg font-bold mt-1 \${stat.color}\`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Your Events</h2>
          <span className="text-neutral-500 text-xs">{hasActiveFilters ? \`\${filteredCount}/\${totalCount}\` : totalCount} events</span>
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
                  <span className={\`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shrink-0 \${
                    event.status === 'ACTIVE' ? 'bg-green-950/30 text-green-400 border-green-900/50' :
                    event.status === 'PENDING_APPROVAL' ? 'bg-yellow-950/30 text-yellow-400 border-yellow-900/50' :
                    'bg-red-950/30 text-red-400 border-red-900/50'
                  }\`}>
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
                    style={{ width: \`\${Math.min(event.sellPercentage, 100)}%\` }}
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
`);

// =============================================
// DONE
// =============================================
console.log('\\n✅ Search/Filter added to all key pages!');
console.log('');
console.log('   📦 UPDATED PAGES:');
console.log('   • /passes → Search by event/pass ID + Status filter');
console.log('   • /admin → Search users + Role filter + Stats');
console.log('   • /seller → Search events + Status filter + Revenue stats');
console.log('');
console.log('   ✨ FEATURES:');
console.log('   • Consistent UI across all pages');
console.log('   • Real-time filtering (no reload)');
console.log('   • Empty states for filtered results');
console.log('   • Count badges showing filtered/total');
console.log('   • Mobile-friendly horizontal scroll tabs');
console.log('');