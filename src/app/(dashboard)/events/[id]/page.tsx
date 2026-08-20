'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface PassType { id: string; name: string; price: number; benefits: string; available: number; sold: number; transferAllowed: boolean; }
interface Event { id: string; title: string; description: string; date: string; time: string; location: string; venue: string; category: string; passes: PassType[]; }

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedPass, setSelectedPass] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/data/events')
      .then(r => r.json())
      .then(data => { setEvent(data.find((e: Event) => e.id === params.id) || null); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [params.id]);

  if (!loaded) return <div className="px-4 pt-6"><p className="text-neutral-500">Loading...</p></div>;
  if (!event) return <div className="px-4 pt-6 text-center"><p className="text-neutral-500">Event not found</p><button onClick={() => router.back()} className="text-[#c4f000] text-sm mt-2">Go back</button></div>;

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const selected = event.passes.find(p => p.id === selectedPass);
  const total = selected ? selected.price * quantity : 0;

  const handleGetPass = () => {
    if (!selectedPass) return;
    router.push(`/checkout?eventId=${event.id}&passTypeId=${selectedPass}&quantity=${quantity}`);
  };

  return (
    <div className="pb-24">
      <div className="h-48 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
        <span className="text-neutral-600 text-sm">{event.category}</span>
        <button onClick={() => router.back()} className="absolute top-4 left-4 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>
      <div className="px-4 pt-5 space-y-6">
        <div className="space-y-2">
          <h1 className="text-white text-xl font-bold">{event.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{dateStr} · {event.time}</span>
            <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>{event.venue}, {event.location}</span>
          </div>
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed">{event.description}</p>
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm">Select Pass</h2>
          <div className="space-y-2">
            {event.passes.map(pass => (
              <button key={pass.id} onClick={() => setSelectedPass(pass.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedPass === pass.id ? 'border-[#c4f000] bg-[#c4f000]/5' : 'border-neutral-800 bg-neutral-900'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold text-sm ${selectedPass === pass.id ? 'text-[#c4f000]' : 'text-white'}`}>{pass.name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{pass.benefits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">₹{pass.price}</p>
                    <p className="text-neutral-600 text-[10px]">{pass.available} left</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {selectedPass && (
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <span className="text-neutral-400 text-sm">Quantity</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center text-lg">−</button>
              <span className="text-white font-bold w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-8 h-8 rounded-lg bg-neutral-800 text-white flex items-center justify-center text-lg">+</button>
            </div>
          </div>
        )}
      </div>
      {selectedPass && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-neutral-800 p-4 z-40">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div><p className="text-neutral-500 text-xs">Total</p><p className="text-white font-bold text-lg">₹{total}</p></div>
            <button onClick={handleGetPass} className="bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold px-8 py-3.5 rounded-xl transition-all active:scale-[0.98]">GET PASS</button>
          </div>
        </div>
      )}
    </div>
  );
}
