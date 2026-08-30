'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, MapPin, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PassService, type Pass } from '@/features/passes';
import { TransferService } from '@/features/transfers';
import { Skeleton } from '@/shared/components/ui/States';

export default function PassDetailPage(){
  const {id}=useParams<{id:string}>(),router=useRouter();
  const [pass,setPass]=useState<Pass|null>(null),[loaded,setLoaded]=useState(false),[pending,setPending]=useState(false),[copied,setCopied]=useState(false);
  useEffect(()=>{PassService.getPassById(id).then(async item=>{setPass(item);if(item)setPending(Boolean(await TransferService.getPendingTransferForPass(item.id)));}).finally(()=>setLoaded(true));},[id]);
  if(!loaded)return <div className="px-5 pt-6 space-y-5"><Skeleton className="h-8 w-28"/><Skeleton className="h-[29rem] rounded-[1.75rem]"/><div className="grid grid-cols-2 gap-3"><Skeleton className="h-16"/><Skeleton className="h-16"/></div></div>;
  if(!pass)return <div className="min-h-[70vh] grid place-items-center"><div className="text-center"><p className="muted">Pass not found.</p><button onClick={()=>router.back()} className="text-blue-500 text-sm mt-2">Go back</button></div></div>;
  const date=new Date(pass.eventDate),qr=`https://scenezy.app/v/${pass.credential}`;
  const copy=async()=>{await navigator.clipboard.writeText(pass.credential);setCopied(true);setTimeout(()=>setCopied(false),1600);};
  const directions=()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pass.eventVenue}, ${pass.eventLocation}`)}`,'_blank','noopener,noreferrer');
  return <div className="px-5 pt-5 pb-6 min-h-[calc(100vh-5rem)] flex flex-col gap-4">
    <header className="flex items-center justify-between"><button onClick={()=>router.back()} className="flex items-center gap-2 muted text-sm"><ArrowLeft size={17}/>My passes</button><span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[.14em] ${pass.status==='ACTIVE'?'border-emerald-500/30 text-emerald-400 bg-emerald-500/10':'border-[var(--line)] muted'}`}>{pass.status}</span></header>
    <section className="ticket-paper rounded-[1.75rem] overflow-hidden h-[clamp(22rem,58vh,29rem)] flex flex-col">
      <div className="p-5 pb-4"><div className="flex items-start justify-between gap-4"><div><p className="ticket-muted text-[9px] uppercase tracking-[.2em]">Scenezy · {pass.passTypeName}</p><h1 className="ticket-ink display-serif text-[1.75rem] leading-none mt-2">{pass.eventTitle}</h1></div><div className="text-right shrink-0"><p className="ticket-muted text-[9px] uppercase tracking-[.18em]">Pass</p><p className="ticket-ink display-serif text-xl mt-1">#{pass.id.slice(0,4).toUpperCase()}</p></div></div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-5"><div><p className="ticket-muted text-[9px] uppercase tracking-[.14em]">Date</p><p className="ticket-ink text-xs font-semibold mt-1">{date.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</p></div><div><p className="ticket-muted text-[9px] uppercase tracking-[.14em]">Time</p><p className="ticket-ink text-xs font-semibold mt-1">{pass.eventTime}</p></div><div><p className="ticket-muted text-[9px] uppercase tracking-[.14em]">Venue</p><p className="ticket-ink text-xs font-semibold mt-1 truncate">{pass.eventVenue}</p></div><div><p className="ticket-muted text-[9px] uppercase tracking-[.14em]">City</p><p className="ticket-ink text-xs font-semibold mt-1 truncate">{pass.eventLocation}</p></div></div>
      </div>
      <div className="ticket-seam mx-5"/>
      <div className="flex-1 px-5 py-3 flex flex-col items-center justify-center"><div className={`bg-white p-2.5 rounded-2xl ${pass.status!=='ACTIVE'?'opacity-35 grayscale':''}`}><QRCodeSVG value={qr} size={130} level="H"/></div><p className="ticket-muted text-[9px] uppercase tracking-[.2em] mt-3">{pass.status==='ACTIVE'?'Present at entry':'Pass is not active'}</p>{pending&&<p className="text-amber-500 text-[10px] mt-1">Transfer awaiting claim</p>}</div>
    </section>
    <div className="grid grid-cols-2 gap-3"><button onClick={copy} className="editorial-card min-h-16 flex items-center justify-center gap-2 text-xs font-semibold text-white">{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Copied':'Copy pass ID'}</button><button onClick={directions} className="editorial-card min-h-16 flex items-center justify-center gap-2 text-xs font-semibold text-white"><MapPin size={17}/>Directions</button></div>
    {pass.status==='ACTIVE'&&!pending&&<button onClick={()=>router.push(`/passes/${pass.id}/transfer`)} className="w-full py-3 text-xs muted flex items-center justify-center gap-2"><Send size={15}/>Transfer this pass</button>}
  </div>;
}
