'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { OrderService } from '@/features/orders';
import eventsData from '@/data/events.json';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const eventId = searchParams.get('eventId') || '';
  const passTypeId = searchParams.get('passTypeId') || '';
  const quantity = parseInt(searchParams.get('quantity') || '1');

  const event = eventsData.events.find(e => e.id === eventId);
  const passType = event?.passes.find(p => p.id === passTypeId);

  useEffect(() => {
    authService.getCurrentUser().then(u => {
      if (!u) router.push('/sign-in');
      else setUser(u);
    });
  }, [router]);

  if (!event || !passType) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-neutral-500">Invalid checkout data</p>
        <button onClick={() => router.back()} className="text-[#c4f000] text-sm mt-2">Go back</button>
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
      const result = await OrderService.createAndPayOrder({
        userId: user.id,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        eventVenue: event.venue,
        items: [{
          passTypeId: passType.id,
          passTypeName: passType.name,
          quantity,
          unitPrice: passType.price,
        }],
      });

      if (result.success) {
        router.push(`/passes/success?orderId=${result.order.id}`);
      } else {
        setError(result.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white text-lg font-bold">Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
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
            <span className="text-[#c4f000] font-bold text-lg">₹{total}</span>
          </div>
        </div>
      </div>

      {/* Payment Method (Mock) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
        <p className="text-neutral-400 text-xs uppercase tracking-wider font-medium">Payment Method</p>
        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 border border-[#c4f000]/30 rounded-xl">
          <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">MOCK</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Mock Payment</p>
            <p className="text-neutral-500 text-xs">Simulated · No real charge</p>
          </div>
          <svg className="w-5 h-5 text-[#c4f000] ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Processing...
          </span>
        ) : (
          `PAY ₹${total}`
        )}
      </button>

      <p className="text-center text-neutral-600 text-[10px]">
        This is a mock payment. No real money will be charged.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6"><p className="text-neutral-500">Loading...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
