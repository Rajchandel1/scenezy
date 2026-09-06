import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { events, notifications, orders, passes, passTypes } from '@/shared/db/schema';

type StoredItem={passTypeId:string;passTypeName:string;quantity:number;unitPrice:number;total:number};
const credential=()=>`PASS_${crypto.randomUUID().replaceAll('-','')}`;

export async function fulfillPaidOrder(providerOrderId:string,paymentId:string) {
  return db.transaction(async tx=>{
    const [order]=await tx.select().from(orders).where(eq(orders.providerOrderId,providerOrderId)).limit(1);
    if(!order)throw new Error('ORDER_NOT_FOUND');
    if(order.orderStatus==='PAID')return order;
    if(order.orderStatus!=='CREATED')throw new Error('ORDER_NOT_PAYABLE');
    const [claimed]=await tx.update(orders).set({paymentStatus:'SUCCESS',orderStatus:'PAID',transactionId:paymentId}).where(and(eq(orders.id,order.id),eq(orders.orderStatus,'CREATED'))).returning();
    if(!claimed){
      const [latest]=await tx.select().from(orders).where(eq(orders.id,order.id)).limit(1);
      if(latest?.orderStatus==='PAID')return latest;
      throw new Error('ORDER_NOT_PAYABLE');
    }
    const [event]=await tx.select().from(events).where(eq(events.id,order.eventId)).limit(1);
    if(!event)throw new Error('EVENT_UNAVAILABLE');
    const items=order.items as StoredItem[];
    for(const item of items){
      const [reserved]=await tx.update(passTypes).set({available:sql`${passTypes.available} - ${item.quantity}`,sold:sql`${passTypes.sold} + ${item.quantity}`}).where(and(eq(passTypes.id,item.passTypeId),gte(passTypes.available,item.quantity))).returning();
      if(!reserved)throw new Error('SOLD_OUT_AFTER_PAYMENT');
    }
    const issued=items.flatMap(item=>Array.from({length:item.quantity},()=>({eventId:event.id,eventTitle:event.title,passTypeId:item.passTypeId,passTypeName:item.passTypeName,price:item.unitPrice,ownerUserId:order.userId,status:'ACTIVE' as const,credential:credential(),eventDate:event.date,eventTime:event.time,eventLocation:event.location,eventVenue:event.venue})));
    await tx.insert(passes).values(issued);
    await tx.insert(notifications).values({userId:order.userId,type:'purchase',title:'Passes ready',body:`Your ${issued.length} pass${issued.length===1?'':'es'} for ${event.title} are now in your wallet.`,icon:'ticket',link:'/passes'});
    return claimed;
  });
}
