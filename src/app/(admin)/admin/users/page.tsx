'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/features/auth';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setAdmin(u);
      const res = await fetch('/api/data/admin?action=users');
      setUsers(await res.json());
    }
    load();
  }, []);

  const handleAction = async (action: string, userId: string) => {
    await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, userId, adminId: admin?.id, adminName: admin?.name }) });
    const res = await fetch('/api/data/admin?action=users');
    setUsers(await res.json());
  };

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Users ({users.length})</h1>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#2563eb]" />
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{u.name}</p>
              <p className="text-neutral-500 text-xs">{u.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">{u.role}</span>
                {u.suspended && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-950/50 text-red-400">Suspended</span>}
              </div>
            </div>
            <div className="flex gap-1.5">
              {u.suspended ? (
                <button onClick={() => handleAction('reactivate-user', u.id)} className="text-[10px] bg-green-950/30 text-green-400 border border-green-900/50 px-2 py-1 rounded-lg">Reactivate</button>
              ) : (
                <button onClick={() => handleAction('suspend-user', u.id)} className="text-[10px] bg-red-950/30 text-red-400 border border-red-900/50 px-2 py-1 rounded-lg">Suspend</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
