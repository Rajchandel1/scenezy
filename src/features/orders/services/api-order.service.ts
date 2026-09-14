import { Order } from '../types';
import { invalidateClientCache } from '../../../shared/lib/client-data-cache';

type CheckoutInput={eventId:string;items:Array<{passTypeId:string;quantity:number}>};
type CheckoutOrder={order:Order;providerOrderId:string;keyId:string};
type PaymentProof={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};

async function readResponse<T>(response:Response, fallback:string):Promise<T>{
  const raw=await response.text();
  if(!raw.trim())throw new Error(response.ok?fallback:`${fallback} (server returned ${response.status})`);
  try{return JSON.parse(raw) as T;}
  catch{throw new Error(response.ok?fallback:`${fallback} (invalid server response)`);}
}

export class ApiOrderService {
  static async createOrder(input:CheckoutInput):Promise<CheckoutOrder>{
    const storageKey=`scenezy_checkout_${input.eventId}_${input.items.map(item=>`${item.passTypeId}:${item.quantity}`).join('_')}`;
    let idempotencyKey=sessionStorage.getItem(storageKey);
    if(!idempotencyKey){idempotencyKey=crypto.randomUUID();sessionStorage.setItem(storageKey,idempotencyKey);}
    const response=await fetch('/api/data/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,idempotencyKey})});
    const data=await readResponse<CheckoutOrder&{error?:string;retryable?:boolean}>(response,'Checkout service is temporarily unavailable');
    if(!response.ok){if(data.retryable)sessionStorage.removeItem(storageKey);throw new Error(data.error||'Checkout failed');}
    if(!data.providerOrderId||!data.keyId)throw new Error('Payment gateway is not configured');
    return data;
  }

  static async verifyPayment(proof:PaymentProof):Promise<{order:Order;success:boolean}>{
    const response=await fetch('/api/data/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',...proof})});
    const data=await readResponse<{order:Order;success:boolean;error?:string}>(response,'Payment verification service is temporarily unavailable');
    if(!response.ok)throw new Error(data.error||'Payment verification failed');
    invalidateClientCache('private:passes:');
    invalidateClientCache('private:orders:');
    invalidateClientCache(`public:event:${data.order.eventId}`);
    invalidateClientCache('public:content');
    return data;
  }

  static async getOrdersByUser(userId:string):Promise<Order[]>{
    const response=await fetch(`/api/data/orders?userId=${encodeURIComponent(userId)}`);
    const data=await readResponse<Order[]&{error?:string}>(response,'Could not load orders');
    if(!response.ok)throw new Error(('error' in data&&data.error)||'Could not load orders');
    return data;
  }
}
