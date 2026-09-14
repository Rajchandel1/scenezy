'use client';
/* eslint-disable @next/next/no-img-element -- poster URLs may be signed/proxied at runtime */
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { authService } from '@/features/auth';
import { NotificationBell } from '@/shared/components/layout/NotificationBell';
import { EmptyState, ErrorState, EventCardSkeleton } from '@/shared/components/ui/States';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { FilterTabs } from '@/shared/components/ui/FilterTabs';
import { useClientQuery } from '@/shared/hooks/useClientQuery';
import { eventDateParts, formatEventDate } from '@/shared/lib/event-date';

interface PassType{id:string;name:string;price:number;available:number}
interface Event{id:string;title:string;description:string;date:string;time:string;location:string;venue:string;category:string;sellerName:string;posterUrl?:string|null;passes:PassType[]}
interface Section{id:string;title:string;eyebrow:string;layout:'FEATURE'|'GRID'|'RAIL'|'COMPACT';events:Event[]}
interface ContentPayload {events:Event[];sections:Section[];categories:Array<{name:string}>}
const price=(event:Event)=>event.passes.length?Math.min(...event.passes.map(pass=>pass.price)):0;
const formatDate=(date:string)=>formatEventDate(date);

function Artwork({event,className='',eager=false}:{event:Event;className?:string;eager?:boolean}){
  const gradients:Record<string,string>={Music:'linear-gradient(135deg,#21104f,#3158d4 58%,#f28b45)',Party:'linear-gradient(135deg,#4a092b,#c11ca8 55%,#ffc857)',Comedy:'linear-gradient(135deg,#f4bb35,#ed5a24 55%,#641020)',Sports:'linear-gradient(135deg,#07382f,#20a65a 60%,#d3ef55)',Conference:'linear-gradient(135deg,#071226,#1451a8 58%,#4dd8ed)',Workshop:'linear-gradient(135deg,#201a17,#14877c 58%,#f1d76a)'};
  const fallback=gradients[event.category]||'linear-gradient(135deg,#071226,#3158d4 58%,#7d92ff)';
  return <div className={`overflow-hidden ${className}`} style={{backgroundColor:'#162a68',backgroundImage:fallback}}>{event.posterUrl&&<img src={event.posterUrl} alt="" loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'} decoding="async" className="absolute inset-0 h-full w-full object-cover"/>}<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent"/><div className="absolute -top-16 -right-10 w-48 h-48 rounded-full border-[28px] border-white/10"/><span className="absolute top-4 left-4 text-white/80 text-[9px] font-bold tracking-[.2em] uppercase">{event.category}</span></div>;
}

function AutoCarousel({children,className='',interval=4200}:{children:ReactNode;className?:string;interval?:number}){
  const ref=useRef<HTMLDivElement>(null),paused=useRef(false),index=useRef(0);
  useEffect(()=>{const timer=window.setInterval(()=>{const track=ref.current;if(!track||paused.current||document.hidden)return;const slides=Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));if(slides.length<2)return;index.current=(index.current+1)%slides.length;track.scrollTo({left:slides[index.current].offsetLeft-track.offsetLeft,behavior:'smooth'});},interval);return()=>window.clearInterval(timer);},[interval]);
  return <div ref={ref} onPointerDown={()=>paused.current=true} onPointerUp={()=>{paused.current=false;const track=ref.current;if(track){const slides=Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));index.current=Math.max(0,slides.reduce((best,slide,current)=>Math.abs(slide.offsetLeft-track.scrollLeft)<Math.abs(slides[best].offsetLeft-track.scrollLeft)?current:best,0));}}} onMouseEnter={()=>paused.current=true} onMouseLeave={()=>paused.current=false} className={`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide ${className}`}>{children}</div>;
}

function SectionHeading({section}:{section:Section}){return <div className="flex items-end justify-between mb-4"><div>{section.eyebrow&&<p className="eyebrow">{section.eyebrow}</p>}<h2 className="display-serif text-2xl text-[var(--ink)] mt-1">{section.title}</h2></div><Link href="/explore" className="muted text-xs flex items-center gap-1">See all <ArrowRight size={13}/></Link></div>}
function HomeSection({section}:{section:Section}){
  const items=section.events;if(!items.length)return null;
  if(section.layout==='FEATURE')return <section><SectionHeading section={section}/><AutoCarousel className="gap-4 rounded-[1.8rem]" interval={4800}>{items.map(event=><Link data-slide href={`/events/${event.id}`} key={event.id} className="block relative w-full h-[22rem] rounded-[1.8rem] overflow-hidden group shrink-0 snap-start"><Artwork event={event} className="absolute inset-0 group-hover:scale-[1.03] transition duration-700"/><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent p-6 flex flex-col justify-end text-white"><p className="text-[9px] uppercase tracking-[.2em] text-white/65">Spotlight · {event.category}</p><h3 className="display-serif text-3xl leading-none mt-2">{event.title}</h3><p className="text-white/70 text-xs mt-2 flex gap-1"><MapPin size={13}/>{event.venue}, {event.location}</p><div className="flex justify-between mt-4 text-xs"><span>{formatDate(event.date)}{event.time?` · ${event.time}`:''}</span><strong className="bg-white text-black rounded-full px-3 py-1.5">From ₹{price(event)}</strong></div></div></Link>)}</AutoCarousel></section>;
  if(section.layout==='GRID')return <section><SectionHeading section={section}/><AutoCarousel className="gap-3 pb-2" interval={3900}>{items.map(event=><Link data-slide href={`/events/${event.id}`} key={event.id} className="editorial-card overflow-hidden w-[calc(50%_-_0.375rem)] shrink-0 snap-start"><Artwork event={event} className="relative h-40"/><div className="p-4"><h3 className="font-semibold text-sm truncate">{event.title}</h3><p className="muted text-[10px] mt-1 truncate">{formatDate(event.date)} · {event.location}</p><p className="text-blue-500 font-bold text-xs mt-3">From ₹{price(event)}</p></div></Link>)}</AutoCarousel></section>;
  if(section.layout==='RAIL')return <section className="-mx-5 sm:-mx-6"><div className="px-5 sm:px-6"><SectionHeading section={section}/></div><AutoCarousel className="gap-3 px-5 sm:px-6 pb-2" interval={3500}>{items.map(event=><Link data-slide href={`/events/${event.id}`} key={event.id} className="block relative w-[78vw] max-w-[19rem] h-52 rounded-[1.6rem] overflow-hidden shrink-0 snap-start border border-white/10"><Artwork event={event} className="absolute inset-0"/><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent p-5 flex flex-col justify-end text-white"><p className="text-[9px] uppercase tracking-[.18em] text-white/65">{event.category} · {formatDate(event.date)}</p><h3 className="display-serif text-2xl mt-1">{event.title}</h3><div className="flex items-center justify-between mt-2"><p className="text-white/65 text-xs truncate">{event.venue}, {event.location}</p><strong className="text-xs shrink-0 ml-3">₹{price(event)}+</strong></div></div></Link>)}</AutoCarousel></section>;
  return <section><SectionHeading section={section}/><div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{items.map(event=><Link href={`/events/${event.id}`} key={event.id} className="py-3 flex items-center gap-4"><div className="display-serif text-center w-11"><span className="text-xl block">{eventDateParts(event.date).day}</span><span className="eyebrow">{eventDateParts(event.date).month}</span></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-sm truncate">{event.title}</h3><p className="muted text-[11px] mt-1 truncate">{event.time?`${event.time} · `:''}{event.venue}, {event.location}</p></div><strong className="text-xs text-blue-500">₹{price(event)}+</strong><ArrowRight size={15} className="muted"/></Link>)}</div></section>;
}

export default function HomePage(){
  const [name,setName]=useState('there'),[query,setQuery]=useState(''),[category,setCategory]=useState('all');
  const fetchContent=useCallback(async()=>{const response=await fetch('/api/data/content');if(!response.ok)throw new Error('Events could not be loaded.');return response.json() as Promise<ContentPayload>;},[]);
  const {data:content,loading,error,refresh}=useClientQuery({key:'public:content',fetcher:fetchContent,freshForMs:60_000,retainForMs:10*60_000});
  const events=content?.events||[],sections=content?.sections||[];
  const categories=useMemo(()=>[{id:'all',label:'All'},...(content?.categories||[]).map(item=>({id:item.name,label:item.name}))],[content]);
  useEffect(()=>{authService.getCurrentUser().then(user=>user&&setName(user.name.split(' ')[0]));},[]);
  const filtered=events.filter(event=>(category==='all'||event.category===category)&&(!query.trim()||[event.title,event.location,event.venue,event.description].some(value=>value.toLowerCase().includes(query.toLowerCase()))));
  const browsing=query.trim()||category!=='all';
  const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening';
  const fallback:Section[]=[{id:'fallback-feature',title:'Featured today',eyebrow:'Editor’s selection',layout:'FEATURE',events:events.slice(0,3)},{id:'fallback-coming',title:'Coming up',eyebrow:'Worth leaving home for',layout:'COMPACT',events:events.slice(3)}];
  return <div className="px-5 sm:px-6 pt-7 pb-5 space-y-8"><header className="flex items-start justify-between"><div><p className="eyebrow">{new Date().toLocaleDateString('en-IN',{weekday:'long',month:'short',day:'numeric'})}</p><h1 className="display-serif text-[2.25rem] leading-[.98] mt-2 text-[var(--ink)]">{greeting},<br/><em className="font-normal">{name}</em></h1></div><div className="flex items-center gap-2"><NotificationBell/><Link href="/profile" className="w-10 h-10 rounded-full brand-button grid place-items-center font-bold uppercase">{name[0]}</Link></div></header><SearchBar value={query} onChange={setQuery} placeholder="Search events, venues, cities…"/><FilterTabs tabs={categories} activeTab={category} onTabChange={setCategory}/>
    {loading?<div className="space-y-4"><EventCardSkeleton/><EventCardSkeleton/></div>:error?<ErrorState message={error} onRetry={()=>void refresh()}/>:browsing?(filtered.length?<section><div className="flex justify-between mb-4"><h2 className="display-serif text-2xl">Search results</h2><span className="eyebrow">{filtered.length} found</span></div><HomeSection section={{id:'results',title:'',eyebrow:'',layout:'GRID',events:filtered}}/></section>:<EmptyState title="No matching scenes" description="Try another search or category." actionLabel="Clear filters" actionOnClick={()=>{setQuery('');setCategory('all');}}/>):<div className="space-y-10">{(sections.length?sections:fallback).map(section=><HomeSection key={section.id} section={section}/>)}</div>}
  </div>;
}
