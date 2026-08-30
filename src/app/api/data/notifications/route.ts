import { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/shared/db';
import { notifications } from '@/shared/db/schema';
import { requireApiUser } from '@/shared/lib/api-auth';

export async function GET(req:NextRequest) {
  const auth=await requireApiUser(); if(auth.error)return auth.error;
  const requested=new URL(req.url).searchParams.get('userId');
  if(requested && auth.profile.role!=='ADMIN' && requested!==auth.profile.id) return Response.json({error:'Forbidden'},{status:403});
  const userId=auth.profile.role==='ADMIN'&&requested?requested:auth.profile.id;
  return Response.json(await db.select().from(notifications).where(eq(notifications.userId,userId)).orderBy(desc(notifications.createdAt)));
}

export async function POST(req:NextRequest) {
  const auth=await requireApiUser(); if(auth.error)return auth.error;
  const body=await req.json();
  if(body.action==='mark-read') {
    await db.update(notifications).set({read:true}).where(and(eq(notifications.id,body.notifId),eq(notifications.userId,auth.profile.id)));
    return Response.json({success:true});
  }
  if(body.action==='mark-all-read') {
    await db.update(notifications).set({read:true}).where(eq(notifications.userId,auth.profile.id));
    return Response.json({success:true});
  }
  if(body.action==='unread-count') {
    const rows=await db.select({id:notifications.id}).from(notifications).where(and(eq(notifications.userId,auth.profile.id),eq(notifications.read,false)));
    return Response.json({count:rows.length});
  }
  // Self-notifications remain available for non-sensitive client UX; the
  // authenticated identity always overrides a browser-provided userId.
  if(body.action==='create') {
    const [created]=await db.insert(notifications).values({userId:auth.profile.id,type:String(body.type||'info'),title:String(body.title||'Update').slice(0,120),body:String(body.body||'').slice(0,500),icon:String(body.icon||'info').slice(0,30),link:body.link?String(body.link).slice(0,300):null}).returning();
    return Response.json(created,{status:201});
  }
  return Response.json({error:'Unknown action'},{status:400});
}
