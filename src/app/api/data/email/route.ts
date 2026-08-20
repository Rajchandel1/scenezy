import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendEmail, generateToken, verificationEmail, passwordResetEmail, purchaseEmail } from '@/shared/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // SEND VERIFICATION EMAIL
  if (action === 'send-verification') {
    const { userId, email, name } = body;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in DB
    await db.execute(sql`
      INSERT INTO verification_tokens (user_id, token, type, expires_at)
      VALUES (${userId}, ${token}, 'email_verify', ${expiresAt})
    `);

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await sendEmail(email, 'Verify your email - PASS', verificationEmail(name, verifyUrl));

    return Response.json({ success: true });
  }

  // VERIFY EMAIL (user clicked link)
  if (action === 'verify') {
    const { token } = body;

    const result = await db.execute(sql`
      SELECT vt.*, u.email, u.name FROM verification_tokens vt
      JOIN users u ON u.id = vt.user_id
      WHERE vt.token = ${token} AND vt.type = 'email_verify' AND vt.used = false AND vt.expires_at > NOW()
      LIMIT 1
    `);

    const row = (result as any).rows?.[0];
    if (!row) return Response.json({ error: 'Invalid or expired link' }, { status: 400 });

    // Mark token as used
    await db.execute(sql`UPDATE verification_tokens SET used = true WHERE token = ${token}`);

    // Mark user as verified
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, row.user_id));

    return Response.json({ success: true, email: row.email });
  }

  // SEND PASSWORD RESET
  if (action === 'send-reset') {
    const { email } = body;
    
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return Response.json({ success: true }); // Don't reveal if email exists

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.execute(sql`
      INSERT INTO verification_tokens (user_id, token, type, expires_at)
      VALUES (${user.id}, ${token}, 'password_reset', ${expiresAt})
    `);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendEmail(email, 'Reset your password - PASS', passwordResetEmail(user.name, resetUrl));

    return Response.json({ success: true });
  }

  // SEND PURCHASE CONFIRMATION
  if (action === 'send-purchase') {
    const { email, name, eventTitle, count } = body;
    const passesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/passes`;
    await sendEmail(email, `You're going to ${eventTitle}! 🎉`, purchaseEmail(name, eventTitle, count, passesUrl));
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
