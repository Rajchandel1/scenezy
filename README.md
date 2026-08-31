# Scenezy

Scenezy is a mobile-first event pass platform built with Next.js, Supabase, PostgreSQL/Drizzle, and Tailwind CSS. It includes user and seller flows, pass purchasing and transfers, QR entry scanning, and admin views.

## Local development

Requirements: Node.js 20 or newer, npm, and a Supabase project.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Fill in `.env.local` before testing authentication, database, or email features. Never commit `.env.local` or service-role/database credentials.

## Environment variables

Copy `.env.example` and configure these values in both local development and Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (prefer the Supabase transaction pooler for serverless deployments)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- `APP_URL`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if Google OAuth is enabled

For production, set `APP_URL` to the final HTTPS Vercel domain. Also add that domain and `/auth/callback` URL to the allowed redirect URLs in Supabase authentication settings.

## Quality checks

```bash
npm run lint
npm run build
```

Both commands should pass before pushing.

## Push to GitHub

Create an empty GitHub repository, then run from this directory:

```bash
git init
git add .
git commit -m "Initial Scenezy deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Review `git status` before committing. `.env*`, `.next`, `node_modules`, and `.vercel` are ignored; `.env.example` is intentionally safe to commit.

## Deploy to Vercel

1. In Vercel, select **Add New > Project** and import the GitHub repository.
2. Vercel should detect **Next.js**. Keep the default build command (`npm run build`) and output settings.
3. Add every environment variable listed above for Production (and Preview if needed).
4. Deploy, then update `APP_URL` to the assigned production domain and redeploy.
5. Add the production callback URL to Supabase and your Google OAuth configuration.

No `vercel.json` is required; this app uses the standard Next.js deployment configuration.

## Database and email

The Drizzle schema is in `src/shared/db/schema.ts`. Apply it to the production Supabase database before using the deployed app. See `EMAIL_SETUP_GUIDE.md` for SMTP setup details.
