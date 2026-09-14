# Scenezy email authentication setup

The app uses Supabase Auth and Resend SMTP. Do not put the Resend API key in
browser code or in a `NEXT_PUBLIC_*` variable.

## 1. Enable email confirmation

In Supabase Dashboard:

1. Open **Authentication -> Providers -> Email**.
2. Keep **Allow new users to sign up** enabled.
3. Enable **Confirm email**.
4. Save.

When this is disabled, Supabase treats every email as confirmed and signup
immediately creates a signed-in session.

## 2. Configure URLs

Open **Authentication -> URL Configuration**.

- Site URL: `https://scenezy.vercel.app`
- Add redirect URL: `https://scenezy.vercel.app/auth/confirm`
- For local testing also add: `http://localhost:3000/auth/confirm`
- Keep the existing Google OAuth callback URL if Google sign-in is enabled.

## 3. Configure Resend SMTP

Open **Project Settings -> Authentication -> SMTP Settings**, enable custom
SMTP, then enter:

- Sender name: `Scenezy`
- Sender email: an address on your verified Resend domain
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key

For production, verify your own sending domain in Resend. Do not repeatedly
send to made-up addresses: bounces reduce sender reputation.

## 4. Confirm signup template

Open **Authentication -> Email Templates -> Confirm signup** and use this link
inside the button:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email"
   style="display:block;background:#2563eb;color:#ffffff;text-align:center;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700">
  Verify email
</a>
```

Suggested subject: `Verify your Scenezy email`

## 5. Reset password template

Open **Authentication -> Email Templates -> Reset password** and use this link
inside the button:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery"
   style="display:block;background:#2563eb;color:#ffffff;text-align:center;padding:14px 20px;border-radius:12px;text-decoration:none;font-weight:700">
  Reset password
</a>
```

Suggested subject: `Reset your Scenezy password`

These token-hash links are verified by `/auth/confirm` on the server and store
the session in cookies. They work when a user opens the email from a different
browser or mail app and do not depend on a browser-local PKCE code verifier.

## 6. Deleted-account checks

Scenezy profiles are stored in `public.users`, while login identities are
stored separately in Supabase **Authentication -> Users** (`auth.users`).
Deleting only the `public.users` row does not delete the login identity. If a
test account must be recreated with the same email, delete that test identity
from **Authentication -> Users** too, then sign up again. Do not run broad SQL
deletes against either table.

## 7. Test

1. Use a real email address not currently listed in Authentication -> Users.
2. Create an account. The app must show the check-email screen and no dashboard.
3. Open the verification email and confirm it reaches `/auth/confirm`, then the
   correct dashboard.
4. Sign out, request password reset, and open the email in another browser.
5. Set a new password and sign in with it.

Supabase deliberately returns a generic success response for password reset
requests when no account exists, so the app must not reveal whether an email is
registered.
