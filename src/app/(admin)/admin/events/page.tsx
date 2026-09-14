'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { Skeleton } from '@/shared/components/ui/States';
import { useActionDialog } from '@/shared/components/ui/ActionDialog';
import { invalidateClientCache } from '@/shared/lib/client-data-cache';
import { formatEventDate } from '@/shared/lib/event-date';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [categories,setCategories]=useState<string[]>([]);
  const {ask,dialog}=useActionDialog();

  useEffect(() => {
    async function load() {
      try { const [res,content] = await Promise.all([fetch('/api/data/admin?action=events'),fetch('/api/data/content?scope=admin')]); if (!res.ok||!content.ok) throw new Error(); setEvents(await res.json());setCategories((await content.json()).categories.map((item:{name:string})=>item.name)); }
      catch { setError('Could not load events.'); } finally { setLoading(false); }
    }
    load();
  }, []);

  const handleAction = async (action: string, eventId: string) => {
    const reason = action === 'reject-event' ? await ask({title:'Request event changes',description:'Tell the seller exactly what must be corrected before resubmission.',confirmLabel:'Send to seller',field:{label:'Change request',placeholder:'Describe the required changes…',required:true}}) : action === 'close-event' ? await ask({title:'Close this event?',description:'It will stop appearing to customers. You can continue it again later.',confirmLabel:'Close event',tone:'danger'}) : action === 'continue-event' ? await ask({title:'Continue this event?',description:'It will become live and visible to customers again.',confirmLabel:'Continue event'}) : undefined;
    if ((action === 'reject-event' || action === 'close-event' || action === 'continue-event') && !reason) return;
    setActionId(`${action}:${eventId}`); setError('');
    try { const result = await fetch('/api/data/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, eventId, reason }) }); if (!result.ok) throw new Error(); invalidateClientCache('public:content');invalidateClientCache(`public:event:${eventId}`);const res = await fetch('/api/data/admin?action=events'); if (!res.ok) throw new Error(); setEvents(await res.json()); }
    catch { setError('The event could not be updated. Try again.'); } finally { setActionId(''); }
  };

  const filtered = filter === 'ALL' ? events : events.filter(e => e.status === filter);
  const reassign=async(eventId:string,category:string)=>{setActionId(`category:${eventId}`);setError('');try{const response=await fetch('/api/data/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set-event-category',eventId,category})});if(!response.ok)throw new Error();invalidateClientCache('public:content');invalidateClientCache(`public:event:${eventId}`);setEvents(current=>current.map(event=>event.id===eventId?{...event,category}:event));}catch{setError('Category could not be reassigned.');}finally{setActionId('');}};
  const setPoster=async(item:any)=>{const posterUrl=await ask({title:'Set event poster',description:'This image appears in Spotlight, Grid, Rail and event details.',confirmLabel:'Save poster',field:{label:'Public HTTPS image URL',defaultValue:item.posterUrl||'',placeholder:'https://…/poster.jpg'}});if(posterUrl===null)return;setActionId(`poster:${item.id}`);try{const response=await fetch('/api/data/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'set-event-poster',eventId:item.id,posterUrl})});const data=await response.json();if(!response.ok)throw new Error(data.error);setEvents(current=>current.map(event=>event.id===item.id?{...event,posterUrl}:event));}catch(e){setError(e instanceof Error?e.message:'Poster could not be updated.');}finally{setActionId('');}};

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-950/50 text-green-400 border-green-900/50',
    PENDING_APPROVAL: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
    REJECTED: 'bg-red-950/50 text-red-400 border-red-900/50',
    CANCELLED: 'bg-neutral-800 text-neutral-500 border-neutral-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <div><p className="text-blue-400 text-[10px] uppercase tracking-[.2em] font-bold">Moderation queue</p><h1 className="text-white text-2xl font-bold">Events <span className="text-neutral-500">{events.length}</span></h1></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['ALL','All'],['PENDING_APPROVAL','Pending'],['ACTIVE','Active'],['REJECTED','Rejected'],['CANCELLED','Closed']].map(([f,label]) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 p-3 text-sm">{error}</div>}
      <div className="grid md:grid-cols-2 gap-3">
        {loading && Array.from({length:4}).map((_,i)=><div key={i} className="surface rounded-2xl p-5 space-y-3"><Skeleton className="h-5 w-2/3"/><Skeleton className="h-3 w-4/5"/><Skeleton className="h-9 w-40 mt-4"/></div>)}
        {!loading && filtered.map(e => (
          <div key={e.id} className="surface rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm font-medium">{e.title}</p>
                <p className="text-neutral-500 text-xs">{formatEventDate(e.date)} · {e.location} · by {e.sellerName}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${statusColors[e.status] || statusColors.CANCELLED}`}>{e.status==='CANCELLED'?'CLOSED':e.status.replace('_', ' ')}</span>
                  <span className="text-[9px] text-neutral-600">{e.passes?.length || 0} passes</span>
                </div>
                <label className="block mt-3"><span className="text-[9px] uppercase tracking-wider text-neutral-500">Admin category</span><select value={e.category} disabled={actionId===`category:${e.id}`} onChange={event=>reassign(e.id,event.target.value)} className="app-input block mt-1 rounded-lg px-2.5 py-1.5 text-xs min-w-36">{categories.map(category=><option key={category}>{category}</option>)}</select></label>
                <button onClick={()=>setPoster(e)} className="mt-2 text-[10px] text-blue-400 font-semibold">{e.posterUrl?'Change poster':'Add poster image'}</button>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-2 border-t border-neutral-800">
              {e.status === 'PENDING_APPROVAL' && (
                <>
                  <LoadingButton loading={actionId === `approve-event:${e.id}`} loadingLabel="Approving" onClick={() => handleAction('approve-event', e.id)} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-xl font-semibold">Approve</LoadingButton>
                  <LoadingButton loading={actionId === `reject-event:${e.id}`} loadingLabel="Rejecting" onClick={() => handleAction('reject-event', e.id)} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl font-semibold">Reject</LoadingButton>
                </>
              )}
              {e.status === 'ACTIVE' && (
                <LoadingButton loading={actionId === `close-event:${e.id}`} loadingLabel="Closing" onClick={() => handleAction('close-event', e.id)} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl font-semibold">Close event</LoadingButton>
              )}
              {e.status === 'CANCELLED' && <LoadingButton loading={actionId === `continue-event:${e.id}`} loadingLabel="Continuing" onClick={() => handleAction('continue-event', e.id)} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-xl font-semibold">Continue event</LoadingButton>}
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <p className="text-neutral-500 text-sm text-center py-8 md:col-span-2">No events found</p>}
      </div>
      {dialog}
    </div>
  );
}
