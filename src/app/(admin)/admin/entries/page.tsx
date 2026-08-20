'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminEntriesPage() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/data/admin?action=entries').then(r => r.json()).then(setEntries);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Entry Scans ({entries.length})</h1>
      </div>
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className={`rounded-xl p-3 border ${e.result === 'VALID' ? 'bg-green-950/10 border-green-900/30' : 'bg-red-950/10 border-red-900/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${e.result === 'VALID' ? 'bg-green-400' : 'bg-red-400'}`} />
                <p className="text-white text-xs font-medium">{e.eventTitle} · {e.passTypeName}</p>
              </div>
              <span className={`text-[10px] font-bold ${e.result === 'VALID' ? 'text-green-400' : 'text-red-400'}`}>{e.result}</span>
            </div>
            <p className="text-neutral-500 text-[10px] mt-1">{e.reason} · {e.gate} · {new Date(e.scannedAt).toLocaleString()}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No scans yet</p>}
      </div>
    </div>
  );
}
