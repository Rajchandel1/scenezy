'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NotificationBell } from '@/shared/components/layout/NotificationBell';
import { EventCardSkeleton } from '@/shared/components/ui/Skeleton';

interface PassType { id: string; name: string; price: number; benefits: string; available: number; sold: number; transferAllowed: boolean; }
interface Event { id: string; title: string; description: string; date: string; time: string; location: string; venue: string; category: string; sellerName: string; status: string; passes: PassType[]; }

const categories = ['All', 'Party', 'Music', 'Conference', 'Comedy', 'Business', 'Sports', 'Workshop'];

function EventCard({ event }: { event: Event }) {
  const minPrice = Math.min(...event.passes.map(p => p.price));
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Link href={`/events/${event.id}`} className="block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200 hover:border-neutral-700">
      <div className="h-36 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
        <span className="text-neutral-600 text-sm">{event.category}</span>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">{dateStr} · {event.time}</div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-white font-semibold text-base leading-tight">{event.title}</h3>
        <p className="text-neutral-500 text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {event.location} · {event.venue}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[#c4f000] font-bold text-sm">From ₹{minPrice}</span>
          <span className="text-neutral-400 text-xs bg-neutral-800 px-2.5 py-1 rounded-lg">GET PASS →</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/data/events')
      .then(r => r.json())
      .then(data => { setEvents(data.filter((e: Event) => e.status === 'ACTIVE')); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const filtered = events.filter(e => {
    const matchCategory = activeCategory === 'All' || e.category === activeCategory;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="px-4 pt-6 space-y-6">
      {/* Header with Notification Bell */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Discover Events</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Find · Pick · Pay · Pass · Show · Go</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
            <span className="text-[#c4f000] text-sm font-bold">P</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events or city..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000]/30 transition-all" />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${activeCategory === cat ? 'bg-[#c4f000] text-black shadow-lg shadow-[#c4f000]/20' : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Event List with Skeleton Loading */}
      <div className="space-y-4">
        {!loaded ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : filtered.length > 0 ? (
          filtered.map(event => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-neutral-400 text-sm font-medium">No events found</p>
            <p className="text-neutral-600 text-xs">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
