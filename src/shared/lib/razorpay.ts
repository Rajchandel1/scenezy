import { createHmac, timingSafeEqual } from 'crypto';

const apiBase = 'https://api.razorpay.com/v1';

function credentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('RAZORPAY_NOT_CONFIGURED');
  return { keyId, keySecret };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const body = await response.json();
  if (!response.ok) {
    console.error('[Razorpay]', response.status, body?.error?.code || 'request_failed');
    throw new Error(body?.error?.description || 'Razorpay request failed');
  }
  return body as T;
}

export type RazorpayOrder = { id:string; amount:number; currency:string; status:string; receipt:string };
export type RazorpayPayment = { id:string; order_id:string; amount:number; currency:string; status:string };

export function createRazorpayOrder(amountInRupees:number, receipt:string, notes:Record<string,string>) {
  return request<RazorpayOrder>('/orders', {
    method:'POST',
    body:JSON.stringify({ amount:amountInRupees * 100, currency:'INR', receipt, notes }),
  });
}

export function fetchRazorpayPayment(paymentId:string) {
  return request<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

function safeEqualHex(expected:string, received:string) {
  const a=Buffer.from(expected,'utf8'),b=Buffer.from(received,'utf8');
  return a.length===b.length && timingSafeEqual(a,b);
}

export function verifyPaymentSignature(orderId:string, paymentId:string, signature:string) {
  const secret=process.env.RAZORPAY_KEY_SECRET;
  if(!secret) throw new Error('RAZORPAY_NOT_CONFIGURED');
  const expected=createHmac('sha256',secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected,signature);
}

export function verifyWebhookSignature(rawBody:string, signature:string) {
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
  if(!secret) throw new Error('RAZORPAY_WEBHOOK_NOT_CONFIGURED');
  const expected=createHmac('sha256',secret).update(rawBody).digest('hex');
  return safeEqualHex(expected,signature);
}
