'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { Skeleton } from '@/shared/components/ui/States';

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/data/admin?action=sellers');
      setSellers(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  const handleAction = async (action: string, userId: string) => {
    setActionId(`${action}:${userId}`);
    try { await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId }) }); const res = await fetch('/api/data/admin?action=sellers'); setSellers(await res.json()); }
    finally { setActionId(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <div><p className="text-blue-400 text-[10px] uppercase tracking-[.2em] font-bold">Partner access</p><h1 className="text-white text-2xl font-bold">Sellers <span className="text-neutral-500">{sellers.length}</span></h1></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {loading && Array.from({length:4}).map((_,i)=><div key={i} className="surface rounded-2xl p-5 flex gap-3"><Skeleton className="w-11 h-11"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2"/><Skeleton className="h-3 w-3/4"/></div></div>)}
        {!loading && sellers.map(s => (
          <div key={s.id} className="surface rounded-2xl p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-white text-sm font-medium">{s.name}</p>
              <p className="text-neutral-500 text-xs">{s.email}</p>
              <div className="flex gap-2 mt-1">
                {s.approved && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-green-950/50 text-green-400">Approved</span>}
                {s.rejected && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-950/50 text-red-400">Rejected</span>}
                {!s.approved && !s.rejected && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-yellow-950/50 text-yellow-400">Pending</span>}
              </div>
            </div>
            <div className="flex gap-1.5">
              {!s.approved && !s.rejected && (
                <>
                  <LoadingButton loading={actionId === `approve-seller:${s.id}`} loadingLabel="" onClick={() => handleAction('approve-seller', s.id)} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-xl">Approve</LoadingButton>
                  <LoadingButton loading={actionId === `reject-seller:${s.id}`} loadingLabel="" onClick={() => handleAction('reject-seller', s.id)} className="text-xs bg-red-500/10 text-red-400 px-3 py-2 rounded-xl">Reject</LoadingButton>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && sellers.length === 0 && <p className="text-neutral-500 text-sm text-center py-8 md:col-span-2">No sellers yet</p>}
      </div>
    </div>
  );
}
