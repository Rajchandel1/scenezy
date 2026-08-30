'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/data/admin?action=orders').then(r => r.json()).then(setOrders);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-white text-lg font-bold">Orders ({orders.length})</h1>
      </div>
      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">{o.eventTitle}</p>
              <span className="text-[#2563eb] font-bold text-sm">₹{o.total}</span>
            </div>
            <p className="text-neutral-500 text-xs mt-1">{o.items?.length || 0} items · {o.paymentStatus} · {new Date(o.createdAt).toLocaleString()}</p>
            <p className="text-neutral-600 text-[10px] mt-1 font-mono">{o.id}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-neutral-500 text-sm text-center py-8">No orders yet</p>}
      </div>
    </div>
  );
}
