'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="w-full max-w-[340px] text-center space-y-8">
        {/* Success Animation */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#c4f000]/10 border-2 border-[#c4f000] flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-[#c4f000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-white text-2xl font-bold">You're going! 🎉</h1>
            <p className="text-neutral-500 text-sm">Your pass has been added to your wallet</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/passes"
            className="block w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] text-center"
          >
            View My Pass
          </Link>
          <button
            onClick={() => router.push('/home')}
            className="block w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3.5 rounded-xl transition-all active:scale-[0.98]"
          >
            Browse More Events
          </button>
        </div>

        <p className="text-neutral-700 text-[10px]">Order: {orderId}</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><p className="text-neutral-500">Loading...</p></div>}>
      <SuccessContent />
    </Suspense>
  );
}
