'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/data/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/sign-in'), 2000);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-950/30 border border-green-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-bold">Password Reset!</h2>
        <p className="text-neutral-400 text-sm">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-white text-xl font-bold">Reset Password</h1>
        <p className="text-neutral-500 text-sm">Enter OTP and your new password</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Email</label>
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
          placeholder="you@example.com" />
      </div>

      <div className="space-y-1.5">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">6-Digit OTP</label>
        <input type="text" required maxLength={6} inputMode="numeric" pattern="[0-9]{6}"
          value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value.replace(/[^0-9]/g, '') })}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all text-center tracking-[0.5em] text-lg"
          placeholder="000000" />
      </div>

      <div className="space-y-1.5">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">New Password</label>
        <input type="password" required minLength={6} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
          placeholder="Min 6 characters" />
      </div>

      <div className="space-y-1.5">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Confirm Password</label>
        <input type="password" required minLength={6} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
          placeholder="Re-enter password" />
      </div>

      {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <button type="submit" disabled={loading}
        className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>

      <p className="text-center text-neutral-500 text-sm">
        <Link href="/sign-in" className="text-[#c4f000] hover:underline font-medium">← Back to sign in</Link>
      </p>
    </form>
  );
}
