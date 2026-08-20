import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFile(filepath, content) {
  const fullPath = join(__dirname, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.trimStart(), 'utf-8');
  console.log(`  ✅ ${filepath}`);
}

console.log('🔧 Forget Password Flow (Modular OTP)...\n');

// =============================================
// 1. OTP SERVICE (Dummy now, Real later)
// =============================================
createFile('src/features/auth/services/otp.service.ts', `
// =============================================
// OTP SERVICE - Modular Design
// =============================================
// TO SWITCH TO REAL EMAIL OTP LATER:
//   1. Set USE_REAL_OTP = true below
//   2. Implement sendRealOTP() with Nodemailer
//   Nothing else changes!
// =============================================

const USE_REAL_OTP = false; // 🔄 Change to true when email works
const DUMMY_OTP = '123456';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory store (use Redis/DB in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export class OTPService {
  static async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (USE_REAL_OTP) {
      return await this.sendRealOTP(normalizedEmail);
    }

    // DUMMY MODE: Always use 123456
    otpStore.set(normalizedEmail, {
      otp: DUMMY_OTP,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    });

    console.log(\`[OTP] Dummy OTP for \${normalizedEmail}: \${DUMMY_OTP}\`);
    return { success: true, message: 'OTP sent successfully' };
  }

  static async verifyOTP(email: string, otp: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return false;
    }
    if (stored.otp !== otp) return false;

    // Valid OTP - clean up
    otpStore.delete(normalizedEmail);
    return true;
  }

  // Placeholder for real email implementation
  private static async sendRealOTP(email: string): Promise<{ success: boolean; message: string }> {
    // TODO: Use Nodemailer here when ready
    // const otp = generateOTP();
    // await sendEmail(email, 'Reset Password', passwordResetEmail(name, otp));
    // otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
    return { success: false, message: 'Real OTP not implemented yet' };
  }
}
`);

// =============================================
// 2. FORGOT PASSWORD API ROUTE
// =============================================
createFile('src/app/api/data/forgot-password/route.ts', `
import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { OTPService } from '@/features/auth/services/otp.service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // STEP 1: Request OTP
  if (action === 'request') {
    const { email } = body;
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 });

    // Check if user exists in our DB
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return Response.json({ success: true, message: 'If an account exists, OTP has been sent' });
    }

    // Send OTP via our service
    const result = await OTPService.sendOTP(email);
    return Response.json(result);
  }

  // STEP 2: Verify OTP and Reset Password
  if (action === 'reset') {
    const { email, otp, newPassword } = body;
    if (!email || !otp || !newPassword) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(email, otp);
    if (!isValid) {
      return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Update password in Supabase Auth (using service role key)
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      console.error('[Auth] Password update failed:', error.message);
      return Response.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Password reset successfully' });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
`);

// =============================================
// 3. FORGOT PASSWORD PAGE (Request OTP)
// =============================================
createFile('src/app/(auth)/forgot-password/page.tsx', `
'use client';

import { useState } from 'react';
import Link from 'next/link';

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
        <div className="w-16 h-16 mx-auto rounded-full bg-[#c4f000]/10 border border-[#c4f000]/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#c4f000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-white text-xl font-bold">Check your email</h2>
          <p className="text-neutral-400 text-sm">We sent a 6-digit OTP to</p>
          <p className="text-[#c4f000] font-medium text-sm">{email}</p>
          <p className="text-neutral-500 text-xs mt-2">Enter the OTP on the next screen to reset your password.</p>
        </div>
        <Link href="/reset-password"
          className="block w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]">
          Enter OTP
        </Link>
        <button onClick={() => setSent(false)}
          className="text-neutral-500 text-sm hover:text-[#c4f000] transition-colors">
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
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
          placeholder="you@example.com" />
      </div>

      {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <button type="submit" disabled={loading}
        className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
        {loading ? 'Sending OTP...' : 'Send Reset OTP'}
      </button>

      <p className="text-center text-neutral-500 text-sm">
        Remember your password? <Link href="/sign-in" className="text-[#c4f000] hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  );
}
`);

// =============================================
// 4. RESET PASSWORD PAGE (Verify OTP + New Password)
// =============================================
createFile('src/app/(auth)/reset-password/page.tsx', `
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
`);

// =============================================
// 5. UPDATE SIGN-IN PAGE (Add "Forgot Password?" link)
// =============================================
createFile('src/app/(auth)/sign-in/page.tsx', `
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/features/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await authService.login(form);
      if (redirect) router.push(redirect);
      else if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'SELLER') router.push('/seller');
      else router.push('/home');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await authService.loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Google Sign In */}
      <button onClick={handleGoogleSignIn} disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
        {googleLoading ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-600 text-xs uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
            placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Password</label>
          <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
            placeholder="••••••••" />
        </div>
        {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
        
        {/* Forgot Password Link */}
        <div className="text-right">
          <Link href="/forgot-password" className="text-[#c4f000] text-xs hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-neutral-500 text-sm">New here? <Link href="/sign-up" className="text-[#c4f000] hover:underline font-medium">Create account</Link></p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-neutral-500 text-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
`);

// =============================================
// DONE
// =============================================
console.log('\\n✅ Forget Password flow complete!');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('    HOW IT WORKS:');
console.log('   ═══════════════════════════════════════════');
console.log('');
console.log('   1. User clicks "Forgot password?" on sign-in');
console.log('   2. Enters email → /api/data/forgot-password (action: request)');
console.log('   3. OTPService sends dummy OTP (123456)');
console.log('   4. User goes to /reset-password');
console.log('   5. Enters email + OTP (123456) + new password');
console.log('   6. OTP verified → Supabase password updated');
console.log('   7. Redirected to sign-in ✅');
console.log('');
console.log('   ══════════════════════════════════════════');
console.log('   🔄 TO SWITCH TO REAL EMAIL OTP LATER:');
console.log('   ═══════════════════════════════════════════');
console.log('   1. Open src/features/auth/services/otp.service.ts');
console.log('   2. Change: USE_REAL_OTP = false → true');
console.log('   3. Implement sendRealOTP() with Nodemailer');
console.log('');
console.log('    TEST:');
console.log('      • Go to /sign-in → Click "Forgot password?"');
console.log('      • Enter any registered email');
console.log('      • Check terminal for: [OTP] Dummy OTP: 123456');
console.log('      • Go to /reset-password → Enter OTP: 123456');
console.log('      • Set new password → Success! ✅');
console.log('');