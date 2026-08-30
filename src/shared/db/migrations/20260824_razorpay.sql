-- Run once in Supabase SQL Editor before enabling Razorpay checkout.
BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_order_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_provider_order_id_unique
  ON orders (provider_order_id)
  WHERE provider_order_id IS NOT NULL;

COMMIT;
