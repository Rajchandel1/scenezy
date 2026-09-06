# Scenezy production setup

## Database

Run these files in Supabase SQL Editor in order:

1. `src/shared/db/migrations/20260823_security_and_workflow.sql`
2. `src/shared/db/migrations/20260824_home_content_cms.sql`
3. `src/shared/db/migrations/20260824_razorpay.sql`
4. `src/shared/db/migrations/20260904_production_constraints.sql`

The application does not require inventory-reservation, payout, settlement, support-ticket, or refund tables.

## Required environment variables

Copy `.env.example` into the deployment environment. Keep every server secret out of client-side variables.

## Razorpay webhook

Use `https://YOUR_DOMAIN/api/webhooks/razorpay` and subscribe to:

- `payment.captured`
- `order.paid`

Set the same webhook signing secret as `RAZORPAY_WEBHOOK_SECRET`.
