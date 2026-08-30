-- Run once in Supabase SQL Editor before deploying this application version.
BEGIN;

ALTER TABLE events ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON orders (idempotency_key);

-- Prevent more than one live transfer from being created for the same pass.
CREATE UNIQUE INDEX IF NOT EXISTS transfers_one_pending_per_pass
  ON transfers (pass_id)
  WHERE status = 'PENDING';

COMMIT;
