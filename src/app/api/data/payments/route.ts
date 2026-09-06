import { NextRequest } from 'next/server';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { events, orders, sellerContactRequests, sellerPaymentProfiles, users, withdrawalRequests } from '@/shared/db/schema';
import { requireApiUser } from '@/shared/lib/api-auth';

const upiPattern=/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const phonePattern=/^[+]?[0-9 ()-]{8,18}$/;
const withdrawalStatuses=['REQUESTED','PROCESSING','PAID','REJECTED'];
const contactStatuses=['OPEN','CONTACTED','CLOSED'];

async function sellerRevenue(sellerId:string){
  const sellerEvents=await db.select({id:events.id}).from(events).where(eq(events.sellerId,sellerId));
  if(!sellerEvents.length)return 0;
  const paid=await db.select({subtotal:orders.subtotal}).from(orders).where(and(inArray(orders.eventId,sellerEvents.map(event=>event.id)),eq(orders.orderStatus,'PAID')));
  return paid.reduce((sum,order)=>sum+order.subtotal,0);
}

export async function GET(){
  const auth=await requireApiUser(['SELLER','ADMIN']);if(auth.error)return auth.error;
  if(auth.profile.role==='ADMIN'){
    const [profiles,withdrawals,contacts,sellers]=await Promise.all([
      db.select().from(sellerPaymentProfiles),
      db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.requestedAt)).limit(300),
      db.select().from(sellerContactRequests).orderBy(desc(sellerContactRequests.createdAt)).limit(300),
      db.select({id:users.id,name:users.name,email:users.email}).from(users).where(eq(users.role,'SELLER')),
    ]);
    const revenues=await Promise.all(sellers.map(async seller=>[seller.id,await sellerRevenue(seller.id)] as const));
    const revenueMap=Object.fromEntries(revenues);
    return Response.json({sellers:sellers.map(seller=>({...seller,revenue:revenueMap[seller.id]||0,profile:profiles.find(profile=>profile.sellerId===seller.id)||null})),withdrawals:withdrawals.map(item=>({...item,seller:sellers.find(seller=>seller.id===item.sellerId)})),contacts:contacts.map(item=>({...item,seller:sellers.find(seller=>seller.id===item.sellerId)}))});
  }
  const [profile,withdrawals,contacts,revenue]=await Promise.all([
    db.select().from(sellerPaymentProfiles).where(eq(sellerPaymentProfiles.sellerId,auth.profile.id)).limit(1),
    db.select().from(withdrawalRequests).where(eq(withdrawalRequests.sellerId,auth.profile.id)).orderBy(desc(withdrawalRequests.requestedAt)).limit(100),
    db.select().from(sellerContactRequests).where(eq(sellerContactRequests.sellerId,auth.profile.id)).orderBy(desc(sellerContactRequests.createdAt)).limit(50),
    sellerRevenue(auth.profile.id),
  ]);
  const paid=withdrawals.filter(item=>item.status==='PAID').reduce((sum,item)=>sum+item.amount,0);
  const pending=withdrawals.filter(item=>item.status==='REQUESTED'||item.status==='PROCESSING').reduce((sum,item)=>sum+item.amount,0);
  return Response.json({profile:profile[0]||null,withdrawals,contacts,summary:{revenue,paid,pending,available:Math.max(0,revenue-paid-pending)}});
}

export async function POST(req:NextRequest){
  const auth=await requireApiUser(['SELLER','ADMIN']);if(auth.error)return auth.error;
  const body=await req.json(),action=String(body.action||'');
  if(auth.profile.role==='SELLER'&&action==='save-profile'){
    const upiId=String(body.upiId||'').trim(),phone=String(body.phone||'').trim();
    if(!upiPattern.test(upiId))return Response.json({error:'Enter a valid UPI ID, for example name@bank'},{status:400});
    if(phone&&!phonePattern.test(phone))return Response.json({error:'Enter a valid phone number'},{status:400});
    const [saved]=await db.insert(sellerPaymentProfiles).values({sellerId:auth.profile.id,upiId,phone:phone||null}).onConflictDoUpdate({target:sellerPaymentProfiles.sellerId,set:{upiId,phone:phone||null,updatedAt:new Date()}}).returning();
    return Response.json(saved);
  }
  if(auth.profile.role==='SELLER'&&action==='request-withdrawal'){
    const amount=Number(body.amount),note=String(body.note||'').trim().slice(0,300);
    if(!Number.isInteger(amount)||amount<1)return Response.json({error:'Enter a valid amount'},{status:400});
    const [profile]=await db.select().from(sellerPaymentProfiles).where(eq(sellerPaymentProfiles.sellerId,auth.profile.id)).limit(1);
    if(!profile)return Response.json({error:'Set up your UPI ID before requesting payment'},{status:409});
    const result=await db.transaction(async tx=>{
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${auth.profile.id}))`);
      const revenue=await sellerRevenue(auth.profile.id);
      const reserved=await tx.select({amount:withdrawalRequests.amount}).from(withdrawalRequests).where(and(eq(withdrawalRequests.sellerId,auth.profile.id),inArray(withdrawalRequests.status,['REQUESTED','PROCESSING','PAID'])));
      const available=revenue-reserved.reduce((sum,item)=>sum+item.amount,0);
      if(amount>available)return null;
      const [created]=await tx.insert(withdrawalRequests).values({sellerId:auth.profile.id,amount,sellerNote:note||null}).returning();return created;
    });
    return result?Response.json(result,{status:201}):Response.json({error:'Amount exceeds your available balance'},{status:409});
  }
  if(auth.profile.role==='SELLER'&&action==='contact'){
    const type=body.type==='CALL'?'CALL':'MESSAGE',message=String(body.message||'').trim().slice(0,1000),phone=String(body.phone||'').trim();
    if(message.length<5)return Response.json({error:'Please describe how we can help'},{status:400});
    if(type==='CALL'&&!phonePattern.test(phone))return Response.json({error:'A valid callback number is required'},{status:400});
    const [created]=await db.insert(sellerContactRequests).values({sellerId:auth.profile.id,type,message,phone:type==='CALL'?phone:null}).returning();return Response.json(created,{status:201});
  }
  if(auth.profile.role==='ADMIN'&&action==='update-withdrawal'){
    const id=String(body.id||''),status=String(body.status||''),paymentReference=String(body.paymentReference||'').trim().slice(0,150),adminNote=String(body.adminNote||'').trim().slice(0,500);
    if(!withdrawalStatuses.includes(status))return Response.json({error:'Invalid payment status'},{status:400});
    if(status==='PAID'&&!paymentReference)return Response.json({error:'Payment reference is required when marking paid'},{status:400});
    const [updated]=await db.update(withdrawalRequests).set({status,adminNote:adminNote||null,paymentReference:paymentReference||null,paidAt:status==='PAID'?new Date():null,updatedAt:new Date()}).where(eq(withdrawalRequests.id,id)).returning();
    return updated?Response.json(updated):Response.json({error:'Request not found'},{status:404});
  }
  if(auth.profile.role==='ADMIN'&&action==='update-contact'){
    const id=String(body.id||''),status=String(body.status||''),adminNote=String(body.adminNote||'').trim().slice(0,500);
    if(!contactStatuses.includes(status))return Response.json({error:'Invalid contact status'},{status:400});
    const [updated]=await db.update(sellerContactRequests).set({status,adminNote:adminNote||null,updatedAt:new Date()}).where(eq(sellerContactRequests.id,id)).returning();
    return updated?Response.json(updated):Response.json({error:'Request not found'},{status:404});
  }
  return Response.json({error:'Unknown action'},{status:400});
}
