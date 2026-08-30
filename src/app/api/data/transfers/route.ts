import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { notifications, passes, transfers } from '@/shared/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';

const normalize=(value:string)=>value.toLowerCase().trim().replace(/\s+/g,'');
const credential=()=>`PASS_${crypto.randomUUID().replaceAll('-','')}`;

export async function GET(req:NextRequest) {
  const auth=await requireApiUser(); if(auth.error)return auth.error;
  const query=new URL(req.url).searchParams, forUser=query.get('forUser'), passId=query.get('passId'), senderId=query.get('senderId');
  if(forUser) {
    if(auth.profile.role!=='ADMIN' && normalize(forUser)!==normalize(auth.profile.email)) return Response.json({error:'Forbidden'},{status:403});
    return Response.json(await db.select().from(transfers).where(and(eq(transfers.status,'PENDING'),eq(transfers.recipientIdentifier,normalize(forUser)),sql`${transfers.expiresAt} > NOW()`)));
  }
  if(passId) {
    const [pass]=await db.select().from(passes).where(eq(passes.id,passId)).limit(1);
    if(!pass) return Response.json(null);
    if(auth.profile.role!=='ADMIN' && pass.ownerUserId!==auth.profile.id) return Response.json({error:'Forbidden'},{status:403});
    const [transfer]=await db.select().from(transfers).where(and(eq(transfers.passId,passId),eq(transfers.status,'PENDING'))).limit(1);
    return Response.json(transfer||null);
  }
  if(senderId) {
    if(auth.profile.role!=='ADMIN' && senderId!==auth.profile.id) return Response.json({error:'Forbidden'},{status:403});
    return Response.json(await db.select().from(transfers).where(eq(transfers.senderUserId,senderId)));
  }
  if(auth.profile.role!=='ADMIN') return Response.json({error:'Forbidden'},{status:403});
  return Response.json(await db.select().from(transfers));
}

export async function POST(req:NextRequest) {
  const auth=await requireApiUser(); if(auth.error)return auth.error;
  const body=await req.json();
  if(body.action==='create') {
    const recipient=normalize(String(body.recipientIdentifier||''));
    if(!recipient || recipient===normalize(auth.profile.email)) return Response.json({error:'Choose another recipient'},{status:400});
    const [pass]=await db.select().from(passes).where(eq(passes.id,body.passId)).limit(1);
    if(!pass || pass.ownerUserId!==auth.profile.id) return Response.json({error:'Pass not found'},{status:404});
    if(pass.status!=='ACTIVE') return Response.json({error:'Only active passes can be transferred'},{status:400});
    try {
      const [transfer]=await db.insert(transfers).values({ passId:pass.id,senderUserId:auth.profile.id,senderName:auth.profile.name,recipientIdentifier:recipient,status:'PENDING',eventTitle:pass.eventTitle,passTypeName:pass.passTypeName,eventDate:pass.eventDate,eventTime:pass.eventTime,eventLocation:pass.eventLocation,eventVenue:pass.eventVenue,expiresAt:new Date(Date.now()+48*60*60*1000) }).returning();
      await db.insert(notifications).values({userId:auth.profile.id,type:'transfer',title:'Transfer started',body:`Your ${pass.passTypeName} pass is waiting to be claimed.`,icon:'send',link:`/passes/${pass.id}`});
      return Response.json(transfer,{status:201});
    } catch { return Response.json({error:'This pass already has a pending transfer'},{status:409}); }
  }
  if(body.action==='claim') {
    const result=await db.transaction(async tx=>{
      const [transfer]=await tx.select().from(transfers).where(and(eq(transfers.id,body.transferId),eq(transfers.status,'PENDING'))).limit(1);
      if(!transfer) throw new Error('NOT_FOUND');
      if(normalize(transfer.recipientIdentifier)!==normalize(auth.profile.email)) throw new Error('FORBIDDEN');
      if(new Date(transfer.expiresAt)<new Date()) throw new Error('EXPIRED');
      const [updatedPass]=await tx.update(passes).set({ownerUserId:auth.profile.id,credential:credential()}).where(and(eq(passes.id,transfer.passId),eq(passes.ownerUserId,transfer.senderUserId),eq(passes.status,'ACTIVE'))).returning();
      if(!updatedPass) throw new Error('UNAVAILABLE');
      const [claimed]=await tx.update(transfers).set({status:'CLAIMED',recipientUserId:auth.profile.id,claimedAt:new Date()}).where(and(eq(transfers.id,transfer.id),eq(transfers.status,'PENDING'))).returning();
      if(!claimed) throw new Error('UNAVAILABLE');
      await tx.insert(notifications).values([{userId:auth.profile.id,type:'claim',title:'Pass claimed',body:`${transfer.eventTitle} is now in your wallet.`,icon:'ticket',link:`/passes/${transfer.passId}`},{userId:transfer.senderUserId,type:'transfer',title:'Transfer claimed',body:`Your ${transfer.passTypeName} pass was claimed.`,icon:'check',link:'/passes'}]);
      return {success:true,passId:transfer.passId};
    }).catch(error=>({error:error instanceof Error?error.message:'UNAVAILABLE'}));
    if('error' in result) return Response.json({error:result.error==='FORBIDDEN'?'This transfer is not for your account':result.error==='EXPIRED'?'Transfer expired':'Transfer is no longer available'},{status:result.error==='FORBIDDEN'?403:409});
    return Response.json(result);
  }
  if(body.action==='cancel') {
    const [cancelled]=await db.update(transfers).set({status:'CANCELLED'}).where(and(eq(transfers.id,body.transferId),eq(transfers.senderUserId,auth.profile.id),eq(transfers.status,'PENDING'))).returning();
    if(!cancelled) return Response.json({error:'Transfer cannot be cancelled'},{status:409});
    await db.insert(notifications).values({userId:auth.profile.id,type:'transfer',title:'Transfer cancelled',body:'Your pass remains safely in your wallet.',icon:'undo',link:'/passes'});
    return Response.json({success:true});
  }
  return Response.json({error:'Unknown action'},{status:400});
}
