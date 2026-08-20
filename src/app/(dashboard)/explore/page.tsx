'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PassType { id: string; name: string; price: number; }
interface Event { id: string; title: string; date: string; time: string; location: string; status: string; passes: PassType[]; }

export default function ExplorePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/data/events')
      .then(r => r.json())
      .then(data => { setEvents(data.filter((e: Event) => e.status === 'ACTIVE').sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime())); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="px-4 pt-6"><p className="text-neutral-500">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-white text-xl font-bold">Explore</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Upcoming events near you</p>
      </div>
      <div className="space-y-4">
        {events.map(event => {
          const dateObj = new Date(event.date);
          const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
          const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const minPrice = Math.min(...event.passes.map(p => p.price));
          return (
            <Link key={event.id} href={`/events/${event.id}`} className="flex gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3 active:scale-[0.98] transition-transform">
              <div className="flex flex-col items-center justify-center w-12 h-14 bg-neutral-800 rounded-lg shrink-0">
                <span className="text-[#c4f000] text-[10px] font-bold uppercase">{dayName}</span>
                <span className="text-white text-sm font-bold">{dateStr.split(' ')[0]}</span>
                <span className="text-neutral-500 text-[9px]">{dateStr.split(' ')[1]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-semibold truncate">{event.title}</h3>
                <p className="text-neutral-500 text-xs mt-0.5">{event.location} · {event.time}</p>
                <p className="text-[#c4f000] text-xs font-medium mt-1">From ₹{minPrice}</p>
              </div>
              <svg className="w-4 h-4 text-neutral-600 self-center shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
