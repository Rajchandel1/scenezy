'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService, AuthUser } from '@/features/auth';
import { SellerService } from '@/features/seller';

interface Overview {
  totalRevenue: number; monthRevenue: number; totalSold: number;
  totalCapacity: number; checkedIn: number;
  activeCount: number; pastCount: number; pendingCount: number;
  rejectedCount: number; totalEvents: number;
}

interface ActivityItem {
  type: string; userName: string; eventTitle?: string;
  details: string; amount: number; time: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SellerDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bestEvent, setBestEvent] = useState<any>(null);
  const [bestPassType, setBestPassType] = useState<any>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setUser(u);
      if (u) {
        const [dash, act, approved] = await Promise.all([
          SellerService.getDashboard(u.id),
          SellerService.getActivity(u.id),
          SellerService.isApproved(u.id),
        ]);
        setOverview(dash.overview);
        setBestEvent(dash.bestEvent);
        setBestPassType(dash.bestPassType);
        setActivity(act);
        setIsApproved(approved);
      }
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) return <div className="px-4 pt-6"><p className="text-neutral-500">Loading...</p></div>;

  if (isApproved === false) {
    return (
      <div className="px-4 pt-6 space-y-6">
        <h1 className="text-white text-xl font-bold">Seller Dashboard</h1>
        <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-2xl p-6 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-yellow-300 font-semibold">Account Pending Approval</p>
          <p className="text-yellow-400/70 text-sm">Your seller account is under review. You'll be able to create events once approved.</p>
        </div>
      </div>
    );
  }

  if (!overview) return <div className="px-4 pt-6"><p className="text-neutral-500">Error loading data</p></div>;

  return (
    <div className="px-4 pt-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Seller Dashboard</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <Link href="/seller/create" className="bg-[#c4f000] text-black text-xs font-bold px-4 py-2 rounded-xl">+ New Event</Link>
      </div>

      {/* Revenue Hero */}
      <div className="bg-gradient-to-br from-[#c4f000]/10 to-neutral-900 border border-[#c4f000]/20 rounded-2xl p-5 space-y-1">
        <p className="text-neutral-400 text-xs uppercase tracking-wider">Total Revenue</p>
        <p className="text-[#c4f000] text-3xl font-bold">₹{overview.totalRevenue.toLocaleString()}</p>
        <p className="text-neutral-500 text-xs">This month: ₹{overview.monthRevenue.toLocaleString()}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sold', value: overview.totalSold, icon: '🎫' },
          { label: 'Checked In', value: overview.checkedIn, icon: '✅' },
          { label: 'Events', value: overview.totalEvents, icon: '📅' },
          { label: 'Active', value: overview.activeCount, icon: '🟢' },
          { label: 'Pending', value: overview.pendingCount, icon: '⏳' },
          { label: 'Past', value: overview.pastCount, icon: '📁' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-center">
            <span className="text-sm">{s.icon}</span>
            <p className="text-white font-bold text-base mt-0.5">{s.value}</p>
            <p className="text-neutral-500 text-[9px] uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {(bestEvent || bestPassType) && (
        <div className="space-y-2">
          <h2 className="text-white font-semibold text-sm">Highlights</h2>
          <div className="grid grid-cols-2 gap-2">
            {bestEvent && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                <p className="text-neutral-500 text-[10px] uppercase">Best Event</p>
                <p className="text-white text-sm font-medium truncate mt-0.5">{bestEvent.title}</p>
                <p className="text-[#c4f000] text-xs mt-0.5">{bestEvent.sold} sold</p>
              </div>
            )}
            {bestPassType && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                <p className="text-neutral-500 text-[10px] uppercase">Top Pass</p>
                <p className="text-white text-sm font-medium truncate mt-0.5">{bestPassType.name}</p>
                <p className="text-[#c4f000] text-xs mt-0.5">{bestPassType.sold} sold</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Events Quick Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">My Events</h2>
          <Link href="/seller/events" className="text-[#c4f000] text-xs">View All →</Link>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { tab: 'active', label: 'Active', count: overview.activeCount, color: 'text-green-400' },
            { tab: 'pending', label: 'Pending', count: overview.pendingCount, color: 'text-yellow-400' },
            { tab: 'past', label: 'Past', count: overview.pastCount, color: 'text-neutral-400' },
            { tab: 'all', label: 'All', count: overview.totalEvents, color: 'text-white' },
          ].map(t => (
            <Link key={t.tab} href={`/seller/events?tab=${t.tab}`} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-center active:scale-[0.98] transition-transform">
              <p className={`${t.color} font-bold text-lg`}>{t.count}</p>
              <p className="text-neutral-500 text-[9px]">{t.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-2">
        <h2 className="text-white font-semibold text-sm">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-neutral-600 text-xs text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-1.5">
            {activity.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-neutral-900/50 border border-neutral-800/50 rounded-lg px-3 py-2">
                <span className="text-xs">
                  {item.type === 'purchase' ? '💰' : item.type === 'transfer' ? '🔄' : '📷'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-300 text-xs truncate">
                    <span className="text-white font-medium">{item.userName}</span>{' '}
                    {item.type === 'purchase' ? `bought ${item.details}` : item.details}
                  </p>
                  {item.eventTitle && <p className="text-neutral-600 text-[10px]">{item.eventTitle}</p>}
                </div>
                <div className="text-right shrink-0">
                  {item.amount > 0 && <p className="text-[#c4f000] text-xs font-medium">₹{item.amount}</p>}
                  <p className="text-neutral-600 text-[9px]">{timeAgo(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
