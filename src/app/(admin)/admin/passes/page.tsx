'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth';

export default function AdminPassesPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [admin, setAdmin] = useState<any>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setAdmin(u);
      const res = await fetch('/api/data/admin?action=passes');
      setPasses(await res.json());
    }
    load();
  }, []);

  const handleRevoke = async (passId: string) => {
    const reason = prompt('Reason for revocation?');
    if (!reason) return;
    await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'revoke-pass', passId, reason, adminId: admin?.id, adminName: admin?.name }) });
    const res = await fetch('/api/data/admin?action=passes');
    setPasses(await res.json());
  };

  const filtered = filter === 'ALL' ? passes : passes.filter(p => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Passes ({passes.length})</h1>
      </div>
      <div className="flex gap-2">
        {['ALL', 'ACTIVE', 'USED', 'REVOKED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-[#c4f000] text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{p.eventTitle}</p>
              <p className="text-neutral-500 text-xs">{p.passTypeName} · {p.credential?.slice(0, 16)}...</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${p.status === 'ACTIVE' ? 'bg-green-950/50 text-green-400' : p.status === 'USED' ? 'bg-neutral-800 text-neutral-400' : 'bg-red-950/50 text-red-400'}`}>{p.status}</span>
              </div>
            </div>
            {p.status === 'ACTIVE' && (
              <button onClick={() => handleRevoke(p.id)} className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/50 px-2 py-1 rounded-lg shrink-0 ml-2">Revoke</button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No passes found</p>}
      </div>
    </div>
  );
}
