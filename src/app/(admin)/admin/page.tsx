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
            { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, color: 'text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">Users Management</h2>
          <span className="text-neutral-500 text-xs">{hasActiveFilters ? `${filteredCount}/${totalCount}` : totalCount} users</span>
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
