'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { OrderService } from '@/features/orders';
import { PageLoading, Spinner } from '@/shared/components/ui/States';
import Link from 'next/link';

interface CheckoutEvent { id:string; title:string; date:string; time:string; location:string; venue:string; passes:Array<{ id:string; name:string; price:number }> }
interface RazorpayResult { razorpay_order_id:string; razorpay_payment_id:string; razorpay_signature:string }
interface RazorpayInstance { open:()=>void; on:(event:string,callback:(response:{error?:{description?:string}})=>void)=>void }
declare global { interface Window { Razorpay:new(options:Record<string,unknown>)=>RazorpayInstance } }

function loadRazorpay(){
  if(window.Razorpay)return Promise.resolve();
  return new Promise<void>((resolve,reject)=>{const existing=document.querySelector<HTMLScriptElement>('script[data-scenezy-razorpay]');if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Could not load Razorpay')),{once:true});return;}const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.dataset.scenezyRazorpay='true';script.onload=()=>resolve();script.onerror=()=>reject(new Error('Could not load Razorpay'));document.head.appendChild(script);});
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<CheckoutEvent | null>(null);
  const [resolving, setResolving] = useState(true);
  const [accepted,setAccepted]=useState(false);

  const eventId = searchParams.get('eventId') || '';
  const passTypeId = searchParams.get('passTypeId') || '';
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const validQuantity=Number.isInteger(quantity)&&quantity>=1&&quantity<=10;

  const passType = event?.passes.find(p => p.id === passTypeId);

  useEffect(() => {
    authService.getCurrentUser().then(u => {
      if (!u) router.push('/sign-in');
      else setUser(u);
    });
    fetch(`/api/data/events?id=${encodeURIComponent(eventId)}`).then(async response => {
      if (!response.ok) throw new Error('Events unavailable');
      const data:CheckoutEvent|null=await response.json();
      setEvent(data);
    }).catch(() => setEvent(null)).finally(() => setResolving(false));
  }, [router, eventId]);

  if (resolving) return <PageLoading message="Preparing checkout…" />;

  if (!event || !passType||!validQuantity) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-neutral-500">Invalid checkout data</p>
        <button onClick={() => router.back()} className="text-[#2563eb] text-sm mt-2">Go back</button>
      </div>
    );
  }

  const subtotal = passType.price * quantity;
  const fees = Math.round(subtotal * 0.05);
  const total = subtotal + fees;

  const handlePay = async () => {
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      await loadRazorpay();
      const checkout = await OrderService.createOrder({
        eventId: event.id,
        items: [{
          passTypeId: passType.id,
          quantity,
        }],
      });
      const proof=await new Promise<RazorpayResult>((resolve,reject)=>{
        const instance=new window.Razorpay({
          key:checkout.keyId,
          order_id:checkout.providerOrderId,
          amount:checkout.order.total*100,
          currency:'INR',
          name:'Scenezy',
          description:`${event.title} · ${passType.name}`,
          prefill:{name:user.name,email:user.email},
          theme:{color:'#2563eb'},
          modal:{ondismiss:()=>reject(new Error('Payment cancelled'))},
          handler:(response:RazorpayResult)=>resolve(response),
        });
        instance.on('payment.failed',response=>reject(new Error(response.error?.description||'Payment failed')));
        instance.open();
      });
      const result=await OrderService.verifyPayment(proof);
      sessionStorage.removeItem(`scenezy_checkout_${event.id}_${passType.id}:${quantity}`);
      router.push(`/passes/success?orderId=${result.order.id}`);
    } catch (caught) {
      setError(caught instanceof Error?caught.message:'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-7 space-y-7 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div><p className="text-blue-400 text-[10px] font-bold uppercase tracking-[.2em]">Secure checkout</p><h1 className="text-white text-2xl font-bold tracking-tight">Confirm your pass</h1></div>
      </div>

      {/* Order Summary */}
      <div className="ticket-cutout app-surface rounded-[1.75rem] p-5 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between pb-4 ticket-rule">
          <div>
            <p className="text-white font-semibold text-sm">{event.title}</p>
            <p className="text-neutral-500 text-xs mt-0.5">{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {event.time}</p>
          </div>
          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md uppercase">{passType.name}</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">₹{passType.price} × {quantity}</span>
            <span className="text-white">₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Platform fee (5%)</span>
            <span className="text-white">₹{fees}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-800">
            <span className="text-white font-bold">Total</span>
            <span className="text-[#2563eb] font-bold text-lg">₹{total}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="app-surface rounded-2xl p-5 space-y-3">
        <p className="text-neutral-400 text-xs uppercase tracking-wider font-medium">Payment Method</p>
        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 border border-[#2563eb]/30 rounded-xl">
          <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">RZP</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Razorpay secure checkout</p>
            <p className="text-neutral-500 text-xs">UPI · Cards · Netbanking · Wallets</p>
          </div>
          <svg className="w-5 h-5 text-[#2563eb] ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <label className="editorial-card p-4 flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)} className="mt-0.5 accent-blue-600"/><span className="muted text-xs leading-5">I agree to the <Link href="/terms" target="_blank" className="text-blue-400">booking terms</Link>. Your booking is confirmed after payment succeeds and passes are issued.</span></label>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={loading||!accepted}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-700/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" className="text-current" />
            Opening Razorpay…
          </span>
        ) : (
          `PAY ₹${total}`
        )}
      </button>

      <p className="text-center text-neutral-600 text-[10px]">
        Payment details are handled securely by Razorpay. Scenezy never stores your card or UPI credentials.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoading message="Opening checkout…" />}>
      <CheckoutContent />
    </Suspense>
  );
}
