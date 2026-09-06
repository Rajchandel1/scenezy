CREATE TABLE IF NOT EXISTS seller_payment_profiles (
  seller_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  upi_id TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','PROCESSING','PAID','REJECTED')),
  seller_note TEXT,
  admin_note TEXT,
  payment_reference TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_seller_idx ON withdrawal_requests(seller_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_idx ON withdrawal_requests(status, requested_at DESC);

CREATE TABLE IF NOT EXISTS seller_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MESSAGE','CALL')),
  message TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CONTACTED','CLOSED')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_contact_requests_seller_idx ON seller_contact_requests(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_contact_requests_status_idx ON seller_contact_requests(status, created_at DESC);

ALTER TABLE seller_payment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_contact_requests ENABLE ROW LEVEL SECURITY;
