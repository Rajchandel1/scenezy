'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/data/admin?action=audit').then(r => r.json()).then(setLogs);
  }, []);

  const actionColors: Record<string, string> = {
    SUSPEND_USER: 'text-red-400', REACTIVATE_USER: 'text-green-400',
    APPROVE_SELLER: 'text-green-400', REJECT_SELLER: 'text-red-400',
    REVOKE_PASS: 'text-red-400', CANCEL_EVENT: 'text-orange-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Audit Log ({logs.length})</h1>
      </div>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${actionColors[log.action] || 'text-neutral-300'}`}>{log.action}</span>
              <span className="text-neutral-600 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-neutral-400 text-xs mt-1">By {log.actorName} · {log.targetType}: {log.targetId.slice(0, 16)}...</p>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <p className="text-neutral-600 text-[10px] mt-1 font-mono">{JSON.stringify(log.metadata)}</p>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No audit entries yet</p>}
      </div>
    </div>
  );
}
