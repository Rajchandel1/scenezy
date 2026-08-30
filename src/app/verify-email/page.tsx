'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLoading } from '@/shared/components/ui/States';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    async function verify() {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const res = await fetch('/api/data/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', token }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage('Email verified successfully!');
          setTimeout(() => router.push('/sign-in'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong.');
      }
    }
    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-5">
      <div className="text-center space-y-4 max-w-sm">
        {status === 'loading' && (
          <PageLoading message={message} />
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-950/30 border border-green-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-white text-xl font-bold">Email Verified!</h2>
            <p className="text-neutral-400 text-sm">Redirecting to sign in...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-950/30 border border-red-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-white text-xl font-bold">Verification Failed</h2>
            <p className="text-neutral-400 text-sm">{message}</p>
            <Link href="/sign-up" className="inline-block text-[#2563eb] text-sm hover:underline">Try signing up again</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoading message="Checking verification link…" />}>
      <VerifyContent />
    </Suspense>
  );
}
