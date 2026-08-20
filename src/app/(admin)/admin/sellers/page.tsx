'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth';

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setAdmin(u);
      const res = await fetch('/api/data/admin?action=sellers');
      setSellers(await res.json());
    }
    load();
  }, []);

  const handleAction = async (action: string, userId: string) => {
    await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId, adminId: admin?.id, adminName: admin?.name }) });
    const res = await fetch('/api/data/admin?action=sellers');
    setSellers(await res.json());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Sellers ({sellers.length})</h1>
      </div>
      <div className="space-y-2">
        {sellers.map(s => (
          <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
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
                  <button onClick={() => handleAction('approve-seller', s.id)} className="text-[10px] bg-green-950/30 text-green-400 border border-green-900/50 px-2 py-1 rounded-lg">Approve</button>
                  <button onClick={() => handleAction('reject-seller', s.id)} className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/50 px-2 py-1 rounded-lg">Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
        {sellers.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No sellers yet</p>}
      </div>
    </div>
  );
}
