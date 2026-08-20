'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService, AuthUser } from '@/features/auth';
import { useRouter } from 'next/navigation';

interface Stats {
  totalUsers: number; totalSellers: number; pendingSellers: number;
  totalEvents: number; activeEvents: number; pendingEvents: number;
  totalPasses: number; activePasses: number; usedPasses: number;
  totalOrders: number; totalRevenue: number;
  totalEntries: number; entriesToday: number; validEntriesToday: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      if (!u || u.role !== 'ADMIN') { router.push('/sign-in'); return; }
      setUser(u);
      const res = await fetch('/api/data/admin?action=stats');
      setStats(await res.json());
    }
    load();
  }, [router]);

  if (!user || !stats) return <div className="text-neutral-500 text-center pt-20">Loading...</div>;

  const statCards = [
    { label: 'Users', value: stats.totalUsers, icon: '👥', color: 'text-blue-400' },
    { label: 'Sellers', value: stats.totalSellers, icon: '🏪', color: 'text-purple-400' },
    { label: 'Pending Sellers', value: stats.pendingSellers, icon: '⏳', color: 'text-yellow-400' },
    { label: 'Events', value: stats.totalEvents, icon: '📅', color: 'text-cyan-400' },
    { label: 'Active Events', value: stats.activeEvents, icon: '🟢', color: 'text-green-400' },
    { label: 'Pending Events', value: stats.pendingEvents, icon: '⏳', color: 'text-yellow-400' },
    { label: 'Total Passes', value: stats.totalPasses, icon: '🎫', color: 'text-yellow-400' },
    { label: 'Active Passes', value: stats.activePasses, icon: '✅', color: 'text-[#c4f000]' },
    { label: 'Used Passes', value: stats.usedPasses, icon: '✓', color: 'text-neutral-400' },
    { label: 'Orders', value: stats.totalOrders, icon: '🛒', color: 'text-orange-400' },
    { label: 'Revenue', value: `₹${stats.totalRevenue}`, icon: '💰', color: 'text-[#c4f000]' },
    { label: 'Entries Today', value: stats.entriesToday, icon: '📷', color: 'text-pink-400' },
  ];

  const navItems = [
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/sellers', label: 'Sellers', icon: '🏪', badge: stats.pendingSellers },
    { href: '/admin/events', label: 'Events', icon: '📅', badge: stats.pendingEvents },
    { href: '/admin/passes', label: 'Passes', icon: '🎫' },
    { href: '/admin/orders', label: 'Orders', icon: '🛒' },
    { href: '/admin/entries', label: 'Entry Scans', icon: '📷' },
    { href: '/admin/audit', label: 'Audit Log', icon: '📋' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-neutral-500 text-sm">Platform control center</p>
        </div>
        <button onClick={() => { authService.logout(); router.push('/sign-in'); }} className="text-neutral-500 text-xs border border-neutral-800 px-3 py-1.5 rounded-lg hover:text-red-400 hover:border-red-900/50 transition-all">Logout</button>
      </div>

      {/* Pending Alerts */}
      {(stats.pendingSellers > 0 || stats.pendingEvents > 0) && (
        <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-xl p-4 space-y-2">
          <p className="text-yellow-300 text-sm font-medium">⏳ Pending Approvals</p>
          {stats.pendingSellers > 0 && <Link href="/admin/sellers" className="block text-yellow-400/80 text-xs hover:text-yellow-300">{stats.pendingSellers} seller(s) waiting for approval →</Link>}
          {stats.pendingEvents > 0 && <Link href="/admin/events" className="block text-yellow-400/80 text-xs hover:text-yellow-300">{stats.pendingEvents} event(s) waiting for approval →</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <span className="text-lg">{s.icon}</span>
            <p className={`${s.color} font-bold text-xl mt-1`}>{s.value}</p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-semibold text-sm">Manage</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-3 hover:border-[#c4f000]/30 transition-all active:scale-[0.98] relative">
              <span>{item.icon}</span>
              <span className="text-neutral-300 text-sm font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
