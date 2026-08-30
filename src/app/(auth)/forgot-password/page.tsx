'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/data/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#2563eb]/10 border border-[#2563eb]/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">Check your email</h2>
          <p className="text-neutral-400 text-sm">We sent a 6-digit OTP to</p>
          <p className="text-[#2563eb] font-medium text-sm">{email}</p>
          <p className="text-neutral-500 text-xs mt-2">Enter the OTP on the next screen to reset your password.</p>
        </div>
        <Link href="/reset-password"
          className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]">
          Enter OTP
        </Link>
        <button onClick={() => setSent(false)}
          className="text-neutral-500 text-sm hover:text-[#2563eb] transition-colors">
          ← Use different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-white text-xl font-bold">Forgot Password?</h1>
        <p className="text-neutral-500 text-sm">Enter your email to receive a reset OTP</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
          placeholder="you@example.com" />
      </div>

      {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <LoadingButton type="submit" loading={loading} loadingLabel="Sending OTP…"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]">
        Send Reset OTP
      </LoadingButton>

      <p className="text-center text-neutral-500 text-sm">
        Remember your password? <Link href="/sign-in" className="text-[#2563eb] hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  );
}
