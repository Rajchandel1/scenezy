'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [admin, setAdmin] = useState<any>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setAdmin(u);
      const res = await fetch('/api/data/admin?action=events');
      setEvents(await res.json());
    }
    load();
  }, []);

  const handleAction = async (action: string, eventId: string) => {
    if (action === 'cancel-event' && !confirm('Cancel this event?')) return;
    await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, eventId, adminId: admin?.id, adminName: admin?.name }) });
    const res = await fetch('/api/data/admin?action=events');
    setEvents(await res.json());
  };

  const filtered = filter === 'ALL' ? events : events.filter(e => e.status === filter);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-950/50 text-green-400 border-green-900/50',
    PENDING_APPROVAL: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
    REJECTED: 'bg-red-950/50 text-red-400 border-red-900/50',
    CANCELLED: 'bg-neutral-800 text-neutral-500 border-neutral-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Events ({events.length})</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-[#c4f000] text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}>
            {f === 'PENDING_APPROVAL' ? 'Pending' : f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm font-medium">{e.title}</p>
                <p className="text-neutral-500 text-xs">{new Date(e.date).toLocaleDateString()} · {e.location} · by {e.sellerName}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${statusColors[e.status] || statusColors.CANCELLED}`}>{e.status.replace('_', ' ')}</span>
                  <span className="text-[9px] text-neutral-600">{e.passes?.length || 0} passes</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-2 border-t border-neutral-800">
              {e.status === 'PENDING_APPROVAL' && (
                <>
                  <button onClick={() => handleAction('approve-event', e.id)} className="text-[10px] bg-green-950/30 text-green-400 border border-green-900/50 px-3 py-1.5 rounded-lg font-medium">Approve</button>
                  <button onClick={() => handleAction('reject-event', e.id)} className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg font-medium">Reject</button>
                </>
              )}
              {e.status === 'ACTIVE' && (
                <button onClick={() => handleAction('cancel-event', e.id)} className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg font-medium">Cancel Event</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No events found</p>}
      </div>
    </div>
  );
}
