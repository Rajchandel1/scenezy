import { Order } from '../types';

type CheckoutInput={eventId:string;items:Array<{passTypeId:string;quantity:number}>};
type CheckoutOrder={order:Order;providerOrderId:string;keyId:string};
type PaymentProof={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};

export class ApiOrderService {
  static async createOrder(input:CheckoutInput):Promise<CheckoutOrder>{
    const storageKey=`scenezy_checkout_${input.eventId}_${input.items.map(item=>`${item.passTypeId}:${item.quantity}`).join('_')}`;
    let idempotencyKey=sessionStorage.getItem(storageKey);
    if(!idempotencyKey){idempotencyKey=crypto.randomUUID();sessionStorage.setItem(storageKey,idempotencyKey);}
    const response=await fetch('/api/data/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,idempotencyKey})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Checkout failed');
    if(!data.providerOrderId||!data.keyId)throw new Error('Payment gateway is not configured');
    return data;
  }

  static async verifyPayment(proof:PaymentProof):Promise<{order:Order;success:boolean}>{
    const response=await fetch('/api/data/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',...proof})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Payment verification failed');
    return data;
  }

  static async getOrdersByUser(userId:string):Promise<Order[]>{
    const response=await fetch(`/api/data/orders?userId=${encodeURIComponent(userId)}`);
    if(!response.ok)throw new Error('Could not load orders');
    return response.json();
  }
}
