'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { Spinner } from '@/shared/components/ui/States';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState<'USER' | 'SELLER'>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerification,setShowVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.register({ ...form, role });
      
      if (!result.needsVerification) {
        // No email confirmation needed - go to callback to create DB entry
        router.push(redirect || '/auth/callback');
      }else setShowVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await authService.loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed');
      setGoogleLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(form.email);
    } catch {}
    setTimeout(() => setResending(false), 2000);
  };

  if (showVerification) {
    return (
      <div className="space-y-5 text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#2563eb]/10 border border-[#2563eb]/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">Check your email</h2>
          <p className="text-neutral-400 text-sm">We sent a verification link to</p>
          <p className="text-[#2563eb] font-medium text-sm">{form.email}</p>
          <p className="text-neutral-500 text-xs mt-2">Click the link to activate your account.</p>
        </div>
        <div className="space-y-2 pt-2">
          <button onClick={handleResend} disabled={resending}
            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm">
            {resending ? 'Sent! Check inbox ✓' : 'Resend verification email'}
          </button>
          <Link href="/sign-in" className="block text-neutral-500 text-sm hover:text-[#2563eb] transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Google Sign Up Button */}
      <button onClick={handleGoogleSignUp} disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
        {googleLoading ? (
          <Spinner size="sm" className="text-current" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-600 text-xs uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">I want to</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setRole('USER')}
            className={`p-3 rounded-xl border text-left transition-all ${role === 'USER' ? 'border-[#2563eb] bg-[#2563eb]/5' : 'border-neutral-800 bg-neutral-900'}`}>
            <span className={`text-sm font-semibold block ${role === 'USER' ? 'text-[#2563eb]' : 'text-white'}`}>Buy Passes</span>
            <span className="text-neutral-500 text-[11px]">Discover & attend events</span>
          </button>
          <button type="button" onClick={() => setRole('SELLER')}
            className={`p-3 rounded-xl border text-left transition-all ${role === 'SELLER' ? 'border-[#2563eb] bg-[#2563eb]/5' : 'border-neutral-800 bg-neutral-900'}`}>
            <span className={`text-sm font-semibold block ${role === 'SELLER' ? 'text-[#2563eb]' : 'text-white'}`}>Sell Passes</span>
            <span className="text-neutral-500 text-[11px]">Create & manage events</span>
          </button>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Name</label>
          <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
            placeholder="Min 6 characters" />
        </div>
        {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
        <LoadingButton type="submit" loading={loading} loadingLabel="Creating account…"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-700/20 transition-all active:scale-[0.98]">
          Create Account
        </LoadingButton>
      </form>

      <p className="text-center text-neutral-500 text-sm">Already have an account? <Link href="/sign-in" className="text-[#2563eb] hover:underline font-medium">Sign in</Link></p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="md" /></div>}>
      <SignUpContent />
    </Suspense>
  );
}
