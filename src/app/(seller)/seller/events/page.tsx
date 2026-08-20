'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth';

interface EnrichedEvent {
  id: string; title: string; date: string; time: string; location: string;
  venue: string; status: string; category: string;
  totalSold: number; totalCapacity: number; revenue: number;
  checkedIn: number; sellPercentage: number;
  passes: any[];
}

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'active';

  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [tab, setTab] = useState(initialTab);
  const [sellerId, setSellerId] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    authService.getCurrentUser().then(u => { if (u) setSellerId(u.id); });
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    setLoaded(false);
    fetch(`/api/data/seller?action=events&sellerId=${sellerId}&tab=${tab}`)
      .then(r => r.json())
      .then(data => { setEvents(data); setLoaded(true); });
  }, [sellerId, tab]);

  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-950/50 text-green-400 border-green-900/50',
    PENDING_APPROVAL: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
    REJECTED: 'bg-red-950/50 text-red-400 border-red-900/50',
    CANCELLED: 'bg-neutral-800 text-neutral-500 border-neutral-700',
  };

  return (
    <div className="px-4 pt-6 space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white text-lg font-bold">My Events</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-neutral-900 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-[#c4f000] text-black' : 'text-neutral-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {!loaded ? (
        <p className="text-neutral-500 text-sm text-center py-8">Loading...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-neutral-500 text-sm">No events here</p>
          <Link href="/seller/create" className="text-[#c4f000] text-sm">Create one →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Link key={event.id} href={`/seller/events/${event.id}`} className="block bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm">{event.title}</h3>
                  <p className="text-neutral-500 text-xs mt-0.5">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.location}</p>
                </div>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-medium ${statusColors[event.status] || statusColors.CANCELLED}`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-neutral-400">{event.totalSold}/{event.totalCapacity} sold</span>
                  <span className="text-[#c4f000]">{event.sellPercentage}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#c4f000] rounded-full transition-all" style={{ width: `${Math.min(event.sellPercentage, 100)}%` }} />
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-4 pt-1 border-t border-neutral-800">
                <span className="text-neutral-400 text-[11px]">💰 ₹{event.revenue.toLocaleString()}</span>
                <span className="text-neutral-400 text-[11px]">✅ {event.checkedIn} in</span>
                <span className="text-neutral-400 text-[11px]">🎫 {event.passes?.length} types</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SellerEventsPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6"><p className="text-neutral-500">Loading...</p></div>}>
      <EventsContent />
    </Suspense>
  );
}
