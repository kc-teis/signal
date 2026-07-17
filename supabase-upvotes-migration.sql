-- Upvotes Migration
-- Run this in the Supabase Dashboard → SQL Editor

ALTER TABLE links ADD COLUMN IF NOT EXISTS upvote_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS upvotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (link_id, device_id)
);

CREATE INDEX IF NOT EXISTS upvotes_link_id_idx ON upvotes(link_id);
CREATE INDEX IF NOT EXISTS upvotes_device_id_idx ON upvotes(device_id);

-- RLS: public read, public insert/delete (same pattern as existing tables — this
-- app has no auth layer, so all write authorization is app-level, not RLS-level)
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upvotes_public_read" ON upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_public_insert" ON upvotes FOR INSERT WITH CHECK (true);
CREATE POLICY "upvotes_public_delete" ON upvotes FOR DELETE USING (true);
