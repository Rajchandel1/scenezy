'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, CircleDollarSign, Store, TicketCheck, Users } from 'lucide-react';
import { DashboardSkeleton, ErrorState } from '@/shared/components/ui/States';

type Stats = { totalUsers:number; totalSellers:number; pendingSellers:number; totalEvents:number; activeEvents:number; pendingEvents:number; totalPasses:number; totalRevenue:number; entriesToday:number };
type Event = { id:string; title:string; sellerName:string; location:string; status:string };
const money = (value:number) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(value || 0);

export default function AdminDashboardPage() {
  const [stats,setStats]=useState<Stats|null>(null), [events,setEvents]=useState<Event[]>([]), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');try{const response=await fetch('/api/data/admin?action=stats');if(!response.ok)throw new Error();const data=await response.json();setStats(data);setEvents(data.events||[]);}catch{setError('The admin dashboard could not be loaded.');}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  if(loading) return <DashboardSkeleton/>;
  if(error||!stats) return <ErrorState message={error||'Dashboard unavailable'} onRetry={load}/>;
  const cards=[['Platform revenue',money(stats.totalRevenue),'Gross processed',CircleDollarSign],['Live events',stats.activeEvents,`${stats.pendingEvents} awaiting review`,CalendarDays],['Community',stats.totalUsers+stats.totalSellers,`${stats.pendingSellers} seller applications`,Users],['Entries today',stats.entriesToday,`${stats.totalPasses} passes issued`,TicketCheck]] as const;
  const pending=events.filter(e=>e.status==='PENDING_APPROVAL');
  const quick=[['/admin/events','Manage events',`${stats.totalEvents} total`,CalendarDays],['/admin/sellers','Manage sellers',`${stats.totalSellers} sellers`,Store],['/admin/users','Manage users',`${stats.totalUsers} attendees`,Users]] as const;
  return <div className="space-y-7">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="eyebrow">Operations</p><h1 className="display-serif text-4xl mt-1">Good to see you.</h1><p className="muted mt-1">Everything happening across Scenezy, in one place.</p></div><Link href="/admin/events" className="brand-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">Review events <ChevronRight size={16}/></Link></header>
    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label,value,note,Icon])=><div key={label} className="editorial-card p-5"><div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--terra)] grid place-items-center"><Icon size={20}/></div><p className="display-serif text-3xl mt-5">{value}</p><p className="text-sm font-semibold mt-1">{label}</p><p className="text-xs muted mt-1">{note}</p></div>)}</section>
    <section className="grid lg:grid-cols-[1.5fr_1fr] gap-5"><div className="app-surface rounded-3xl overflow-hidden"><div className="p-5 border-b border-blue-300/10 flex items-center justify-between"><div><h2 className="font-semibold">Needs your attention</h2><p className="text-xs text-slate-500 mt-1">New events submitted by sellers</p></div><span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-bold">{pending.length} pending</span></div><div className="divide-y divide-blue-300/10">{pending.slice(0,5).map(e=><Link href="/admin/events" key={e.id} className="flex items-center gap-4 p-4 hover:bg-blue-500/5 transition"><div className="w-11 h-11 rounded-xl bg-blue-500/10 grid place-items-center text-blue-400"><CalendarDays size={20}/></div><div className="min-w-0 flex-1"><p className="font-medium truncate">{e.title}</p><p className="text-xs text-slate-500 truncate">{e.sellerName} · {e.location}</p></div><ChevronRight className="text-slate-600" size={18}/></Link>)}{!pending.length&&<div className="p-10 text-center text-slate-500"><TicketCheck className="mx-auto mb-3 text-blue-400"/><p className="font-medium text-slate-300">You are all caught up</p><p className="text-sm mt-1">No events are waiting for approval.</p></div>}</div></div><div className="app-surface rounded-3xl p-5"><h2 className="font-semibold">Quick management</h2><div className="grid gap-2 mt-4">{quick.map(([href,label,note,Icon])=><Link href={href} key={href} className="flex items-center gap-3 rounded-2xl border border-blue-300/10 bg-white/[.02] p-4 hover:bg-blue-500/10 transition"><Icon className="text-blue-400" size={19}/><div className="flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-500">{note}</p></div><ChevronRight size={16} className="text-slate-600"/></Link>)}</div></div></section>
  </div>;
}
