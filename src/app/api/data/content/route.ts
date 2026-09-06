import { NextRequest } from 'next/server';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/shared/db';
import { categories, events, homeSections, passTypes } from '@/shared/db/schema';
import { requireApiUser } from '@/shared/lib/api-auth';
import { eventPosterUrl } from '@/shared/lib/event-poster';

const layouts=['FEATURE','GRID','RAIL','COMPACT'] as const;
const slugify=(value:string)=>value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let publicContentCache:{expires:number;data:unknown}|null=null;

export async function GET(req:NextRequest){
  const admin=new URL(req.url).searchParams.get('scope')==='admin';
  if(admin){const auth=await requireApiUser(['ADMIN']);if(auth.error)return auth.error;}
  if(!admin&&publicContentCache&&publicContentCache.expires>Date.now())return Response.json(publicContentCache.data);
  const [categoryRows,sectionRows]=await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder),asc(categories.name)),
    db.select().from(homeSections).orderBy(asc(homeSections.sortOrder),asc(homeSections.createdAt)),
  ]);
  if(admin){
    const eventRows=await db.select().from(events).orderBy(asc(events.title));
    return Response.json({categories:categoryRows,sections:sectionRows,events:eventRows.map(event=>({...event,posterUrl:eventPosterUrl(event.posterUrl)}))});
  }
  const visibleSections=sectionRows.filter(section=>section.active);
  // Admin controls storefront visibility through ACTIVE/CANCELLED. Do not
  // silently remove events based on the server date; doing so empties curated
  // sections and makes the entire home dashboard look broken.
  const activeEvents=await db.select().from(events).where(eq(events.status,'ACTIVE')).orderBy(asc(events.date));
  const types=activeEvents.length?await db.select().from(passTypes).where(inArray(passTypes.eventId,activeEvents.map(event=>event.id))):[];
  const enrichedEvents=activeEvents.map(event=>({...event,posterUrl:eventPosterUrl(event.posterUrl),passes:types.filter(type=>type.eventId===event.id)}));
  const payload={
    categories:categoryRows.filter(category=>category.active),
    events:enrichedEvents,
    sections:visibleSections.map(section=>({...section,events:section.eventIds.map(id=>enrichedEvents.find(event=>event.id===id)).filter(Boolean)})),
  };
  publicContentCache={expires:Date.now()+15_000,data:payload};
  return Response.json(payload);
}

export async function POST(req:NextRequest){
  publicContentCache=null;
  const auth=await requireApiUser(['ADMIN']);
  if(auth.error)return auth.error;
  const body=await req.json(),action=String(body.action||'');
  try{
    if(action==='create-category'){
      const name=String(body.name||'').trim().slice(0,50),slug=slugify(name);
      if(!name||!slug)return Response.json({error:'Category name is required'},{status:400});
      const [created]=await db.insert(categories).values({name,slug,sortOrder:Number(body.sortOrder)||0}).returning();
      return Response.json(created,{status:201});
    }
    if(action==='update-category'){
      const [current]=await db.select().from(categories).where(eq(categories.id,String(body.id))).limit(1);
      if(!current)return Response.json({error:'Category not found'},{status:404});
      const name=String(body.name||current.name).trim().slice(0,50),slug=slugify(name);
      await db.transaction(async tx=>{await tx.update(categories).set({name,slug,active:Boolean(body.active),sortOrder:Number(body.sortOrder)||0,updatedAt:new Date()}).where(eq(categories.id,current.id));if(name!==current.name)await tx.update(events).set({category:name}).where(eq(events.category,current.name));});
      return Response.json({success:true});
    }
    if(action==='delete-category'){
      const [current]=await db.select().from(categories).where(eq(categories.id,String(body.id))).limit(1);
      if(!current)return Response.json({error:'Category not found'},{status:404});
      const replacement=String(body.replacementCategory||'').trim();
      const assigned=await db.select({id:events.id}).from(events).where(eq(events.category,current.name));
      if(assigned.length&&!replacement)return Response.json({error:'Choose a replacement category for assigned events'},{status:409});
      await db.transaction(async tx=>{if(assigned.length)await tx.update(events).set({category:replacement}).where(eq(events.category,current.name));await tx.delete(categories).where(eq(categories.id,current.id));});
      return Response.json({success:true});
    }
    if(action==='save-section'){
      const title=String(body.title||'').trim().slice(0,80),layout=String(body.layout||'FEATURE');
      if(!title||!layouts.includes(layout as typeof layouts[number]))return Response.json({error:'Valid title and layout are required'},{status:400});
      const eventIds:string[]=Array.isArray(body.eventIds)?Array.from(new Set((body.eventIds as unknown[]).map(value=>String(value)))).slice(0,20):[];
      const values={title,eyebrow:String(body.eyebrow||'').trim().slice(0,80),layout,eventIds,active:body.active!==false,sortOrder:Number(body.sortOrder)||0,updatedAt:new Date()};
      if(body.id){const [updated]=await db.update(homeSections).set(values).where(eq(homeSections.id,String(body.id))).returning();return Response.json(updated);}
      const [created]=await db.insert(homeSections).values(values).returning();return Response.json(created,{status:201});
    }
    if(action==='delete-section'){await db.delete(homeSections).where(eq(homeSections.id,String(body.id)));return Response.json({success:true});}
    if(action==='reorder-sections'){
      const ids:string[]=Array.isArray(body.ids)?(body.ids as unknown[]).map(String):[];
      if(!ids.length)return Response.json({error:'Section order is required'},{status:400});
      await db.transaction(async tx=>{for(let index=0;index<ids.length;index++)await tx.update(homeSections).set({sortOrder:(index+1)*10,updatedAt:new Date()}).where(eq(homeSections.id,ids[index]));});
      return Response.json({success:true});
    }
    if(action==='set-event-category'){
      const category=String(body.category||'').trim();
      const [valid]=await db.select().from(categories).where(eq(categories.name,category)).limit(1);
      if(!valid)return Response.json({error:'Category not found'},{status:400});
      const [updated]=await db.update(events).set({category}).where(eq(events.id,String(body.eventId))).returning();
      return updated?Response.json(updated):Response.json({error:'Event not found'},{status:404});
    }
    if(action==='set-event-poster'){
      const posterUrl=String(body.posterUrl||'').trim().slice(0,2000);
      if(posterUrl&&!/^https:\/\//i.test(posterUrl))return Response.json({error:'Use a public HTTPS image URL'},{status:400});
      const [updated]=await db.update(events).set({posterUrl:posterUrl||null}).where(eq(events.id,String(body.eventId))).returning();
      return updated?Response.json(updated):Response.json({error:'Event not found'},{status:404});
    }
    return Response.json({error:'Unknown action'},{status:400});
  }catch(error){
    console.error('[Content CMS]',error);
    return Response.json({error:'Content could not be updated. Names must be unique.'},{status:500});
  }
}
