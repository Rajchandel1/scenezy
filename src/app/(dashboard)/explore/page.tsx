'use client';
/* eslint-disable @next/next/no-img-element -- poster URLs are normalized by the server at runtime */
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { EmptyState, ErrorState, EventCardSkeleton } from '@/shared/components/ui/States';
import { useClientQuery } from '@/shared/hooks/useClientQuery';

interface Event { id:string;title:string;date:string;time:string;location:string;venue:string;category:string;posterUrl?:string|null;passes:Array<{price:number}> }
interface ContentPayload {events:Event[];categories:Array<{name:string}>}

function Artwork({event,featured}:{event:Event;featured:boolean}){
  const date=new Date(event.date);
  return <div className={`relative bg-gradient-to-br from-blue-950 via-blue-700 to-indigo-400 overflow-hidden ${featured?'h-56 sm:h-full':'h-40'}`}>
    {event.posterUrl&&<img src={event.posterUrl} alt={`${event.title} poster`} loading={featured?'eager':'lazy'} fetchPriority={featured?'high':'auto'} decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"/>}
    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/15"/>
    {!event.posterUrl&&<div className="absolute w-48 h-48 rounded-full border-[24px] border-white/10 -top-16 -right-8"/>}
    <span className="absolute left-4 top-4 text-white/80 eyebrow">{event.category}</span>
    <div className="absolute bottom-4 left-4 text-white"><p className="display-serif text-4xl leading-none">{date.getDate()}</p><p className="text-[10px] uppercase tracking-[.18em]">{date.toLocaleDateString('en-IN',{month:'short',weekday:'short'})}</p></div>
  </div>;
}

export default function ExplorePage(){
  const [search,setSearch]=useState(''),[category,setCategory]=useState('all');
  const fetchContent=useCallback(async()=>{const response=await fetch('/api/data/content');if(!response.ok)throw new Error('Explore is unavailable right now.');return response.json() as Promise<ContentPayload>;},[]);
  const {data,loading,error,refresh}=useClientQuery({key:'public:content',fetcher:fetchContent,freshForMs:60_000,retainForMs:10*60_000});
  const events=useMemo(()=>[...(data?.events||[])].sort((a,b)=>+new Date(a.date)-+new Date(b.date)),[data]);
  const tabs=useMemo(()=>[{id:'all',label:'Everything'},...(data?.categories||[]).map(item=>({id:item.name,label:item.name}))],[data]);
  const filtered=useMemo(()=>events.filter(event=>(category==='all'||event.category===category)&&`${event.title} ${event.location} ${event.venue}`.toLowerCase().includes(search.toLowerCase())),[events,category,search]);
  return <div className="px-5 sm:px-6 pt-7 pb-5 space-y-7">
    <header><p className="eyebrow">Find your next scene</p><h1 className="display-serif text-4xl text-[var(--ink)] mt-1">Explore</h1><p className="muted text-sm mt-2">Events, gatherings and experiences worth showing up for.</p></header>
    <SearchBar value={search} onChange={setSearch} placeholder="Search by event, city or venue…"/>
    <FilterTabs tabs={tabs} activeTab={category} onTabChange={setCategory}/>
    {loading?<div className="grid sm:grid-cols-2 gap-4"><EventCardSkeleton/><EventCardSkeleton/><EventCardSkeleton/></div>:error?<ErrorState message={error} onRetry={()=>void refresh()}/>:filtered.length===0?<EmptyState title="No matching scenes" description="Try another category or a broader search." actionLabel="Reset search" actionOnClick={()=>{setSearch('');setCategory('all');}}/>:<div className="grid sm:grid-cols-2 gap-4">{filtered.map((event,index)=>{const min=event.passes.length?Math.min(...event.passes.map(pass=>pass.price)):0;return <Link href={`/events/${event.id}`} key={event.id} className={`editorial-card overflow-hidden group ${index===0?'sm:col-span-2 sm:grid sm:grid-cols-[1.1fr_.9fr]':''}`}><Artwork event={event} featured={index===0}/><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{event.time}</p><h2 className="display-serif text-2xl text-white mt-2 leading-tight">{event.title}</h2></div><span className="w-9 h-9 rounded-full brand-button grid place-items-center shrink-0"><ArrowUpRight size={16}/></span></div><p className="muted text-xs mt-4 flex gap-1.5"><MapPin size={13}/>{event.venue}, {event.location}</p><div className="mt-5 pt-4 border-t border-[var(--line)] flex justify-between text-xs"><span className="muted">Hosted experience</span><strong className="text-[var(--terra)]">From ₹{min}</strong></div></div></Link>;})}</div>}
  </div>;
}
