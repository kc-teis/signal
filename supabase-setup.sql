-- Knowledge Hub: Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Create enums
CREATE TYPE content_type AS ENUM ('ARTICLE', 'VIDEO');
CREATE TYPE link_status AS ENUM ('DRAFT', 'PUBLISHED');

-- Create categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

-- Create links table
CREATE TABLE links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  summary TEXT,
  thumbnail_url TEXT,
  category_id TEXT NOT NULL REFERENCES categories(id),
  content_type content_type NOT NULL DEFAULT 'ARTICLE',
  contributor_name TEXT NOT NULL,
  contributor_email TEXT NOT NULL,
  context_note TEXT,
  metadata JSONB,
  status link_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_links_contributor_email ON links(contributor_email);
CREATE INDEX idx_links_category_id ON links(category_id);
CREATE INDEX idx_links_status_created ON links(status, created_at DESC);

-- Seed categories
INSERT INTO categories (id, name, slug) VALUES
  (gen_random_uuid()::text, 'Product Management', 'pm'),
  (gen_random_uuid()::text, 'User Experience Design', 'ux'),
  (gen_random_uuid()::text, 'Engineering', 'dev'),
  (gen_random_uuid()::text, 'Executives', 'executives'),
  (gen_random_uuid()::text, 'Process', 'process'),
  (gen_random_uuid()::text, 'AI Trends', 'ai-trends'),
  (gen_random_uuid()::text, 'Software Development Life Cycle', 'sdlc');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (open access for internal tool)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth in v1)
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to links" ON links FOR ALL USING (true) WITH CHECK (true);
