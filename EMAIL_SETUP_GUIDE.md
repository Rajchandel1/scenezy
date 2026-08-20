# 📧 Resend + Supabase Email Setup Guide

## STEP 1: Configure Resend as SMTP in Supabase

1. Go to: https://resend.com/smtp
2. Note these values:
   - Host: smtp.resend.com
   - Port: 465
   - Username: resend
   - Password: YOUR_RESEND_API_KEY (same as API key)

3. Go to: Supabase Dashboard → Project Settings → Auth → SMTP Settings
4. Enable "Enable Custom SMTP"
5. Fill in:
   - Sender email: noreply@scenezy.app (or your verified domain on Resend)
   - Sender name: Scenezy
   - Host: smtp.resend.com
   - Port number: 465
   - Username: resend
   - Password: YOUR_RESEND_API_KEY
6. Click Save

## STEP 2: Add Custom Email Templates in Supabase

Go to: Supabase Dashboard → Authentication → Email Templates

### Template 1: Confirm Signup
Paste this in the "Confirm signup" template body:

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:400px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;width:48px;height:48px;background:#c4f000;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#0a0a0a">P</div>
      <h1 style="color:white;font-size:24px;margin:16px 0 4px">Welcome to Scenezy!</h1>
      <p style="color:#737373;font-size:14px;margin:0">Your events. Your passes. Simple.</p>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:24px;margin-bottom:24px">
      <p style="color:#d4d4d4;font-size:14px;line-height:1.6;margin:0 0 16px">
        Thanks for joining Scenezy! Verify your email to start discovering events.
      </p>
      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;background:#c4f000;color:#0a0a0a;font-weight:700;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-size:15px">
        Verify Email
      </a>
    </div>
    <p style="color:#525252;font-size:11px;text-align:center;margin:0">
      Paper Plane UX · Jet Engine Backend<br>
      If you didn't create this account, ignore this email.
    </p>
  </div>
</body>
</html>
```

### Template 2: Reset Password
Paste this in the "Reset password" template body:

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:400px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;width:48px;height:48px;background:#c4f000;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#0a0a0a">P</div>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:24px;margin-bottom:24px">
      <h2 style="color:white;font-size:18px;margin:0 0 12px">Reset Password</h2>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 20px">
        Click below to reset your password. Link expires in 1 hour.
      </p>
      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;background:#c4f000;color:#0a0a0a;font-weight:700;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-size:15px">
        Reset Password
      </a>
    </div>
    <p style="color:#525252;font-size:11px;text-align:center;margin:0">
      Didn't request this? Ignore this email.
    </p>
  </div>
</body>
</html>
```

### Template 3: Magic Link (if using passwordless)
Same as confirm signup but change button text to "Sign In"

## STEP 3: Verify Domain on Resend (Important!)

For emails to not go to spam:
1. Go to: resend.com/domains
2. Add your domain (or use their free onboarding domain for testing)
3. Add DNS records they provide
4. Once verified, update sender email in Supabase SMTP to: noreply@yourdomain.com

## STEP 4: Test

1. npm run dev
2. Sign up with a real email
3. Check inbox — should see a beautiful dark-themed Scenezy email
4. Click verify link → redirected to app → logged in

## ⚠️ Important Notes

- Resend free tier: 3000 emails/month, 100/day
- Without custom domain: emails come from "onboarding@resend.dev" (fine for testing)
- With custom domain: emails come from "noreply@yourdomain.com" (production)
- Supabase {{ .ConfirmationURL }} is the magic variable for verification links