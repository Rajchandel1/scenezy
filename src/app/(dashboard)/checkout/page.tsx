'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { OrderService } from '@/features/orders';
import { buildWhatsAppBookingUrl } from '@/features/orders/services/whatsapp-checkout';
import { PageLoading, Spinner } from '@/shared/components/ui/States';
import Link from 'next/link';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { formatEventDate } from '@/shared/lib/event-date';
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
const [checkoutMode,setCheckoutMode]=useState<'WHATSAPP'|'RAZORPAY'>('WHATSAPP');
// Hardcoded Admin Number for all bookings
const ADMIN_WHATSAPP_NUMBER = '919265461135';
const eventId = searchParams.get('eventId') || '';
const passTypeId = searchParams.get('passTypeId') || '';
const quantity = parseInt(searchParams.get('quantity') || '1');
const validQuantity=Number.isInteger(quantity)&&quantity>=1&&quantity<=10;
const passType = event?.passes.find(p => p.id === passTypeId);
useEffect(() => {
// Check if Razorpay mode is forced via env/config, otherwise default to WhatsApp
const config=window.__SCENEZY_CONFIG__;
if(config?.checkoutMode==='RAZORPAY') setCheckoutMode('RAZORPAY');
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
const fees = 0; // Changed to 0 as per requirement
const total = subtotal + fees;
const isWhatsApp=checkoutMode==='WHATSAPP';
const handleWhatsApp = () => {
if (!user) return;
setError('');
setLoading(true);
try {
const url=buildWhatsAppBookingUrl(ADMIN_WHATSAPP_NUMBER,{
customerName:user.name,
customerEmail:user.email,
eventId:event.id,
eventTitle:event.title,
date:event.date,
time:event.time,
venue:event.venue,
location:event.location,
passTypeId:passType.id,
passTypeName:passType.name,
quantity,
unitPrice:passType.price,
subtotal,
fees,
total,
});
const opened=window.open(url,'_blank');
if(opened)opened.opener=null;
else window.location.assign(url);
} catch (caught) {
setError(caught instanceof Error?caught.message:'WhatsApp booking could not be opened.');
} finally {
window.setTimeout(()=>setLoading(false),600);
}
};
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
<div><p className="text-blue-400 text-[10px] font-bold uppercase tracking-[.2em]">{isWhatsApp?'Assisted booking':'Secure checkout'}</p><h1 className="text-white text-2xl font-bold tracking-tight">Confirm your pass</h1></div>
</div>
{/* Order Summary */}
<div className="ticket-cutout app-surface rounded-[1.75rem] p-5 space-y-4 overflow-hidden">
<div className="flex items-center justify-between pb-4 ticket-rule">
<div>
<p className="text-white font-semibold text-sm">{event.title}</p>
<p className="text-neutral-500 text-xs mt-0.5">{formatEventDate(event.date)}{event.time?` · ${event.time}`:''}</p>
</div>
<span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-1 rounded-md uppercase">{passType.name}</span>
</div>
<div className="space-y-2 text-sm">
<div className="flex justify-between">
<span className="text-neutral-400">₹{passType.price} × {quantity}</span>
<span className="text-white">₹{subtotal}</span>
</div>
<div className="flex justify-between">
<span className="text-neutral-400">Platform fee</span>
<span className="text-green-400 font-medium">Free</span>
</div>
<div className="flex justify-between pt-2 border-t border-neutral-800">
<span className="text-white font-bold">Total</span>
<span className="text-[#2563eb] font-bold text-lg">₹{total}</span>
</div>
</div>
</div>
{/* Payment Method */}
<div className="app-surface rounded-2xl p-5 space-y-3">
<p className="text-neutral-400 text-xs uppercase tracking-wider font-medium">{isWhatsApp?'Booking method':'Payment method'}</p>
{isWhatsApp?(
<div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
<div className="w-10 h-10 bg-emerald-500 text-white rounded-xl grid place-items-center"><MessageCircle size={20}/></div>
<div><p className="text-white text-sm font-medium">Continue on WhatsApp</p><p className="text-neutral-500 text-xs mt-0.5">Booking details will be filled automatically</p></div>
<ShieldCheck className="w-5 h-5 text-emerald-400 ml-auto shrink-0"/>
</div>
):(
<div className="flex items-center gap-3 p-3 bg-neutral-800/50 border border-[#2563eb]/30 rounded-xl">
<div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center"><span className="text-white text-[8px] font-bold">RZP</span></div>
<div><p className="text-white text-sm font-medium">Razorpay secure checkout</p><p className="text-neutral-500 text-xs">UPI · Cards · Netbanking · Wallets</p></div>
<ShieldCheck className="w-5 h-5 text-[#2563eb] ml-auto shrink-0"/>
</div>
)}
{isWhatsApp&&<p className="text-neutral-500 text-xs leading-5">Sending the message requests the booking; it does not issue a ticket by itself. Scenezy will confirm availability, verify payment and then issue the digital pass.</p>}
</div>
{/* Error */}
{error && (
<div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
{error}
</div>
)}
<label className="editorial-card p-4 flex items-start gap-3 cursor-pointer">
<input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)} className="mt-0.5 accent-blue-600"/>
<span className="muted text-xs leading-5">I agree to the <Link href="/terms" target="_blank" className="text-blue-400">Terms & Conditions</Link>, <Link href="/cancellation-refund-policy" target="_blank" className="text-blue-400">Cancellation & Refund Policy</Link>, and acknowledge the <Link href="/privacy" target="_blank" className="text-blue-400">Privacy Policy</Link>. {isWhatsApp?'This WhatsApp message is a booking request; the booking is confirmed only after payment is verified and the pass is issued.':'The booking is confirmed after payment succeeds and passes are issued.'}</span>
</label>
{/* Pay Button */}
<button
onClick={isWhatsApp?handleWhatsApp:handlePay}
disabled={loading||!accepted}
className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-700/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
>
{loading ? (
<span className="flex items-center justify-center gap-2">
<Spinner size="sm" className="text-current" />
{isWhatsApp?'Opening WhatsApp...':'Opening Razorpay...'}
</span>
) : (
isWhatsApp?`BOOK ON WHATSAPP · ₹${total}`:`PAY ₹${total}`
)}
</button>
<p className="text-center text-neutral-600 text-[10px]">
{isWhatsApp?'Scenezy will never ask for your UPI PIN, OTP or card password on WhatsApp.':'Payment details are handled securely by Razorpay. Scenezy never stores your card or UPI credentials.'}
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