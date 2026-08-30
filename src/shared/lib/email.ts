import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('[Email] Gmail connection failed:', error.message);
  } else {
    console.log('[Email] Gmail SMTP ready ✅');
  }
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"PASS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[Email] Sent to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Failed:', error.message);
    return { success: false, error: error.message };
  }
}

export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function verificationEmail(name: string, url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
<div style="max-width:400px;margin:0 auto;padding:40px 20px;box-sizing:border-box">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-block;width:48px;height:48px;background:#2563eb;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#0a0a0a">P</div>
    <h1 style="color:white;font-size:22px;margin:16px 0 4px">Verify your email</h1>
    <p style="color:#737373;font-size:14px;margin:0">Welcome to PASS, ${name}!</p>
  </div>
  <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:24px;box-sizing:border-box">
    <p style="color:#d4d4d4;font-size:14px;line-height:1.6;margin:0 0 20px">Click below to verify and start buying passes.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${url}" style="display:inline-block;width:100%;background:#2563eb;color:#0a0a0a;font-weight:700;text-align:center;padding:14px 0;border-radius:12px;text-decoration:none;font-size:15px;box-sizing:border-box">Verify Email</a>
    </td></tr></table>
  </div>
  <p style="color:#525252;font-size:11px;text-align:center;margin-top:24px">Link expires in 24 hours.</p>
</div></body></html>`;
}

export function passwordResetEmail(name: string, url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
<div style="max-width:400px;margin:0 auto;padding:40px 20px;box-sizing:border-box">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-block;width:48px;height:48px;background:#2563eb;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#0a0a0a">P</div>
    <h1 style="color:white;font-size:22px;margin:16px 0 4px">Reset Password</h1>
  </div>
  <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:24px;box-sizing:border-box">
    <p style="color:#d4d4d4;font-size:14px;margin:0 0 20px">Hey ${name}, click below. Expires in 1 hour.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${url}" style="display:inline-block;width:100%;background:#2563eb;color:#0a0a0a;font-weight:700;text-align:center;padding:14px 0;border-radius:12px;text-decoration:none;font-size:15px;box-sizing:border-box">Reset Password</a>
    </td></tr></table>
  </div>
</div></body></html>`;
}

export function purchaseEmail(name: string, eventTitle: string, count: number, url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
<div style="max-width:400px;margin:0 auto;padding:40px 20px;box-sizing:border-box">
  <div style="text-align:center;margin-bottom:32px">
    <div style="display:inline-block;width:48px;height:48px;background:#2563eb;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#0a0a0a">P</div>
  </div>
  <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:24px;text-align:center;box-sizing:border-box">
    <div style="font-size:40px;margin-bottom:12px">🎉</div>
    <h2 style="color:white;font-size:20px;margin:0 0 8px">You're going!</h2>
    <p style="color:#a3a3a3;font-size:14px;margin:0 0 20px">${count} pass(es) for <strong style="color:white">${eventTitle}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${url}" style="display:inline-block;background:#2563eb;color:#0a0a0a;font-weight:700;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:14px">View Passes</a>
    </td></tr></table>
  </div>
</div></body></html>`;
}
