import { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/shared/db';
import { events, orders, passTypes } from '@/shared/db/schema';
import { requireApiUser } from '@/shared/lib/api-auth';
import { createRazorpayOrder, fetchRazorpayPayment, verifyPaymentSignature } from '@/shared/lib/razorpay';
import { fulfillPaidOrder } from '@/shared/lib/fulfill-order';
import { orderCreateSchema, validationError } from '@/shared/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/shared/lib/rate-limiter';

export async function GET(req:NextRequest){
  const auth=await requireApiUser();
  if(auth.error)return auth.error;
  const requestedUser=new URL(req.url).searchParams.get('userId');
  const userId=auth.profile.role==='ADMIN'&&requestedUser?requestedUser:auth.profile.id;
  return Response.json(await db.select().from(orders).where(eq(orders.userId,userId)).orderBy(desc(orders.createdAt)).limit(100));
}

export async function POST(req:NextRequest){
  const auth=await requireApiUser(['USER']);
  if(auth.error)return auth.error;
  const limit=await checkRateLimit(`checkout:${auth.profile.id}`,20,60);
  if(!limit.allowed)return rateLimitResponse(limit.resetAt);
  try{
    const body=await req.json();
    if(body.action==='verify'){
      const providerOrderId=String(body.razorpay_order_id||''),paymentId=String(body.razorpay_payment_id||''),signature=String(body.razorpay_signature||'');
      if(!providerOrderId||!paymentId||!signature||!verifyPaymentSignature(providerOrderId,paymentId,signature))return Response.json({error:'Payment verification failed'},{status:400});
      const [localOrder]=await db.select().from(orders).where(and(eq(orders.providerOrderId,providerOrderId),eq(orders.userId,auth.profile.id))).limit(1);
      if(!localOrder)return Response.json({error:'Order not found'},{status:404});
      const payment=await fetchRazorpayPayment(paymentId);
      if(payment.order_id!==providerOrderId||payment.amount!==localOrder.total*100||payment.currency!=='INR'||payment.status!=='captured')return Response.json({error:'Payment is not captured yet'},{status:409});
      return Response.json({order:await fulfillPaidOrder(providerOrderId,paymentId),success:true});
    }
    const parsed=orderCreateSchema.safeParse(body);
    if(!parsed.success)return validationError(parsed.error);
    const {idempotencyKey,items:requestedItems,eventId}=parsed.data;
    if(new Set(requestedItems.map(item=>item.passTypeId)).size!==requestedItems.length)return Response.json({error:'Each pass type can appear only once'},{status:400});
    const [existing]=await db.select().from(orders).where(eq(orders.idempotencyKey,idempotencyKey)).limit(1);
    if(existing){
      if(existing.userId!==auth.profile.id)return Response.json({error:'Checkout key conflict'},{status:409});
      return Response.json({order:existing,providerOrderId:existing.providerOrderId,keyId:process.env.RAZORPAY_KEY_ID});
    }
    const [event]=await db.select().from(events).where(and(eq(events.id,eventId),eq(events.status,'ACTIVE'))).limit(1);
    if(!event)return Response.json({error:'This event is unavailable'},{status:400});
    const eventStartsAt=new Date(`${event.date}T${event.time}:00+05:30`).getTime();
    if(!Number.isFinite(eventStartsAt)||eventStartsAt<=Date.now())return Response.json({error:'Booking for this event has closed'},{status:409});
    const normalized=[] as Array<{passTypeId:string;passTypeName:string;quantity:number;unitPrice:number;total:number}>;
    for(const requestItem of requestedItems){
      const [type]=await db.select().from(passTypes).where(and(eq(passTypes.id,requestItem.passTypeId),eq(passTypes.eventId,event.id))).limit(1);
      if(!type||type.available<requestItem.quantity)return Response.json({error:'This pass is sold out or unavailable'},{status:409});
      normalized.push({passTypeId:type.id,passTypeName:type.name,quantity:requestItem.quantity,unitPrice:type.price,total:type.price*requestItem.quantity});
    }
    const subtotal=normalized.reduce((sum,item)=>sum+item.total,0),fees=Math.round(subtotal*.05),total=subtotal+fees;
    const localId=crypto.randomUUID();
    const providerOrder=await createRazorpayOrder(total,`scn_${localId.replaceAll('-','').slice(0,28)}`,{scenezy_order_id:localId,user_id:auth.profile.id,event_id:event.id});
    const [created]=await db.insert(orders).values({id:localId,userId:auth.profile.id,eventId:event.id,eventTitle:event.title,items:normalized,subtotal,fees,total,paymentStatus:'PENDING',orderStatus:'CREATED',providerOrderId:providerOrder.id,idempotencyKey}).returning();
    return Response.json({order:created,providerOrderId:providerOrder.id,keyId:process.env.RAZORPAY_KEY_ID},{status:201});
  }catch(error){
    console.error('[Checkout]',error);
    const message=error instanceof Error&&error.message==='RAZORPAY_NOT_CONFIGURED'?'Razorpay is not configured':'Checkout could not be completed';
    return Response.json({error:message},{status:500});
  }
}
