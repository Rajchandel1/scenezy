import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { OTPService } from '@/features/auth/services/otp.service';
import { checkRateLimit, getClientIP } from '@/shared/lib/rate-limiter';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many requests. Try again in 1 min.' }, { status: 429 });
  }

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
