'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { authService } from '@/features/auth';
import { EventCardSkeleton, PageLoading } from '@/shared/components/ui/States';
import { formatEventDate } from '@/shared/lib/event-date';

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
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-blue-600 text-white' : 'text-neutral-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {!loaded ? (
        <div className="space-y-3"><EventCardSkeleton/><EventCardSkeleton/></div>
      ) : events.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] px-6 py-9 text-center">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-blue-500/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-blue-600/10 blur-2xl" />
          <div className="relative mx-auto mb-6 w-32 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 shadow-[0_18px_50px_rgba(37,99,235,0.12)]">
            <div className="rounded-xl border border-dashed border-blue-400/35 bg-[var(--canvas)] px-4 py-5">
              <CalendarPlus className="mx-auto text-blue-500" size={27} strokeWidth={1.6}/>
              <div className="mx-auto mt-4 h-px w-12 bg-blue-500/30" />
              <p className="mt-3 text-[8px] font-bold uppercase tracking-[.22em] text-blue-500">New scene</p>
            </div>
          </div>
          <div className="relative">
            <p className="eyebrow text-blue-500">{tab === 'all' ? 'Your event studio' : `${tab} events`}</p>
            <h2 className="display-serif mt-2 text-3xl text-[var(--ink)]">{tab === 'active' ? 'Your stage is ready' : 'Nothing here yet'}</h2>
            <p className="muted mx-auto mt-3 max-w-xs text-sm leading-6">{tab === 'active' ? 'Create your next event, submit it for review, and manage every booking from here.' : `You don’t have any ${tab} events right now. Start a new event whenever you’re ready.`}</p>
            <Link href="/seller/create" className="brand-button mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-600/15">Create an event <ArrowRight size={16}/></Link>
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Link key={event.id} href={`/seller/events/${event.id}`} className="block surface rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform hover:border-blue-400/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm">{event.title}</h3>
                  <p className="text-neutral-500 text-xs mt-0.5">{formatEventDate(event.date,{day:'numeric',month:'short',year:'numeric'})} · {event.location}</p>
                </div>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-medium ${statusColors[event.status] || statusColors.CANCELLED}`}>
                  {event.status === 'CANCELLED' ? 'CLOSED' : event.status.replace('_', ' ')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-neutral-400">{event.totalSold}/{event.totalCapacity} sold</span>
                  <span className="text-[#2563eb]">{event.sellPercentage}%</span>
                </div>
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2563eb] rounded-full transition-all" style={{ width: `${Math.min(event.sellPercentage, 100)}%` }} />
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
    <Suspense fallback={<PageLoading message="Opening event studio…" />}>
      <EventsContent />
    </Suspense>
  );
}
