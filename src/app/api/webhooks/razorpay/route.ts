import { fulfillPaidOrder } from '@/shared/lib/fulfill-order';
import { verifyWebhookSignature } from '@/shared/lib/razorpay';

export async function POST(request:Request){
  const rawBody=await request.text();
  const signature=request.headers.get('x-razorpay-signature')||'';
  try{
    if(!signature||!verifyWebhookSignature(rawBody,signature))return Response.json({error:'Invalid signature'},{status:401});
    const payload=JSON.parse(rawBody);
    if(payload.event==='payment.captured'||payload.event==='order.paid'){
      const payment=payload.payload?.payment?.entity;
      const order=payload.payload?.order?.entity;
      const providerOrderId=payment?.order_id||order?.id;
      const paymentId=payment?.id;
      if(providerOrderId&&paymentId)await fulfillPaidOrder(providerOrderId,paymentId);
    }
    return Response.json({received:true});
  }catch(error){
    console.error('[Razorpay webhook]',error);
    return Response.json({error:'Webhook processing failed'},{status:500});
  }
}
