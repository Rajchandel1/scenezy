'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/features/auth';
import { SellerService } from '@/features/seller';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { DashboardSkeleton } from '@/shared/components/ui/States';

interface PassBreakdown { id: string; name: string; price: number; sold: number; total: number; revenue: number; sellPercentage: number; available: number; transferAllowed: boolean; }
interface Buyer { orderId: string; userName: string; userEmail: string; items: any[]; total: number; createdAt: string; paymentStatus: string; }
interface ActivityItem { type: string; userName: string; details: string; amount: number; time: string; }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SellerEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [draft,setDraft]=useState<any>(null),[submitError,setSubmitError]=useState('');

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      if (u) {
        const d = await SellerService.getEventDetail(u.id, params.id as string);
        setData(d);
        setDraft(d?.event?{title:d.event.title,description:d.event.description,date:d.event.date,time:d.event.time,location:d.event.location,venue:d.event.venue,category:d.event.category}:null);
      }
      setLoaded(true);
    }
    load();
  }, [params.id]);

  if (!loaded) return <DashboardSkeleton/>;
  if (!data?.event) return <div className="px-4 pt-6 text-center"><p className="text-neutral-500">Event not found</p></div>;

  const { event, passBreakdown, buyers, activity } = data;
  const resubmit = async () => {
    setResubmitting(true);setSubmitError('');
    try { const response=await fetch('/api/data/events',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventId:event.id,...draft})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Update failed');setData({...data,event:{...event,...draft,status:'PENDING_APPROVAL',moderationReason:null}}); }
    catch(caught){setSubmitError(caught instanceof Error?caught.message:'Event could not be resubmitted');}
    finally { setResubmitting(false); }
  };

  return (
    <div className="px-4 pt-6 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-base font-bold truncate">{event.title}</h1>
          <p className="text-neutral-500 text-[10px]">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {event.time} · {event.location}</p>
        </div>
      </div>

      {event.status === 'REJECTED' && draft&&<div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-3"><div><p className="text-amber-300 text-sm font-semibold">Changes requested</p><p className="text-neutral-400 text-xs mt-1 leading-relaxed">{event.moderationReason || 'Review your event information before submitting again.'}</p></div><div className="grid gap-2"><input className="app-input rounded-xl px-3 py-2 text-sm" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Event title"/><textarea className="app-input rounded-xl px-3 py-2 text-sm resize-none" rows={3} value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="Description"/><div className="grid grid-cols-2 gap-2"><input type="date" className="app-input rounded-xl px-3 py-2 text-sm" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/><input type="time" className="app-input rounded-xl px-3 py-2 text-sm" value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></div><div className="grid grid-cols-2 gap-2"><input className="app-input rounded-xl px-3 py-2 text-sm" value={draft.venue} onChange={e=>setDraft({...draft,venue:e.target.value})} placeholder="Venue"/><input className="app-input rounded-xl px-3 py-2 text-sm" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="City"/></div></div>{submitError&&<p className="text-red-400 text-xs">{submitError}</p>}<LoadingButton loading={resubmitting} loadingLabel="Resubmitting..." onClick={resubmit} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">Save changes and resubmit</LoadingButton></div>}

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-[#2563eb]/10 to-neutral-900 border border-[#2563eb]/20 rounded-xl p-4">
        <p className="text-neutral-400 text-[10px] uppercase tracking-wider">Event Revenue</p>
        <p className="text-[#2563eb] text-2xl font-bold mt-0.5">₹{event.totalRevenue.toLocaleString()}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Sold', value: event.totalSold, max: event.totalCapacity },
          { label: 'Capacity', value: event.totalCapacity },
          { label: 'Checked In', value: event.checkedIn },
          { label: 'Sell %', value: `${event.sellPercentage}%` },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{s.value}{s.max ? `/${s.max}` : ''}</p>
            <p className="text-neutral-500 text-[8px] uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-neutral-400">Overall Sales</span>
          <span className="text-[#2563eb]">{event.sellPercentage}%</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${Math.min(event.sellPercentage, 100)}%` }} />
        </div>
      </div>

      {/* Pass Type Breakdown */}
      <div className="space-y-2">
        <h2 className="text-white font-semibold text-sm">Pass Types</h2>
        <div className="space-y-2">
          {passBreakdown.map((pt: PassBreakdown) => (
            <div key={pt.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{pt.name}</p>
                  <p className="text-neutral-500 text-[10px]">₹{pt.price} · {pt.transferAllowed ? 'Transferable' : 'Non-transferable'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-bold">{pt.sold}/{pt.total}</p>
                  <p className="text-[#2563eb] text-[10px]">₹{pt.revenue.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${Math.min(pt.sellPercentage, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyers List */}
      <div className="space-y-2">
        <h2 className="text-white font-semibold text-sm">Buyers ({buyers.length})</h2>
        {buyers.length === 0 ? (
          <p className="text-neutral-600 text-xs text-center py-3">No purchases yet</p>
        ) : (
          <div className="space-y-1.5">
            {buyers.map((b: Buyer) => (
              <div key={b.orderId} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-medium truncate">{b.userName}</p>
                  <p className="text-neutral-500 text-[10px] truncate">{b.items?.map((i: any) => i.passTypeName).join(', ')}</p>
                  <p className="text-neutral-600 text-[9px]">{timeAgo(b.createdAt)}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-[#2563eb] text-xs font-bold">₹{b.total}</p>
                  <p className={`text-[9px] ${b.paymentStatus === 'SUCCESS' ? 'text-green-500' : 'text-red-400'}`}>{b.paymentStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        <h2 className="text-white font-semibold text-sm">Activity</h2>
        {activity.length === 0 ? (
          <p className="text-neutral-600 text-xs text-center py-3">No activity yet</p>
        ) : (
          <div className="space-y-1">
            {activity.slice(0, 15).map((item: ActivityItem, i: number) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-900/50 rounded-lg">
                <span className="text-[10px]">{item.type === 'purchase' ? '💰' : item.type === 'transfer' ? '🔄' : '📷'}</span>
                <p className="text-neutral-400 text-[11px] flex-1 truncate">
                  {item.userName && <span className="text-white">{item.userName}</span>} {item.details}
                </p>
                <span className="text-neutral-600 text-[9px] shrink-0">{timeAgo(item.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
