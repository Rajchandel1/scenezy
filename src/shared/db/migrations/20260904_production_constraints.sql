-- Production integrity constraints. Resolve any duplicate pass-type names before running.
CREATE UNIQUE INDEX IF NOT EXISTS pass_types_event_name_unique ON pass_types(event_id, name);

DO $$ BEGIN
  ALTER TABLE pass_types ADD CONSTRAINT pass_types_price_nonnegative CHECK (price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE pass_types ADD CONSTRAINT pass_types_availability_nonnegative CHECK (available >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE pass_types ADD CONSTRAINT pass_types_sold_nonnegative CHECK (sold >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_totals_nonnegative CHECK (subtotal >= 0 AND fees >= 0 AND total >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_status_date_idx ON events(status, date);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits(reset_at);
