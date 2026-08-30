-- Run once in Supabase SQL Editor to enable admin-managed categories and home sections.
BEGIN;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  eyebrow TEXT DEFAULT '',
  layout TEXT NOT NULL DEFAULT 'FEATURE' CHECK (layout IN ('FEATURE','GRID','RAIL','COMPACT')),
  event_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Party','party',10),('Music','music',20),('Conference','conference',30),
  ('Comedy','comedy',40),('Business','business',50),('Sports','sports',60),
  ('Workshop','workshop',70),('Other','other',80)
ON CONFLICT (name) DO NOTHING;

COMMIT;
