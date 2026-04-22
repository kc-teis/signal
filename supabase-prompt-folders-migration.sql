-- Prompt Folders Migration
-- Run this in the Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS prompt_folders (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_slugs TEXT[] NOT NULL DEFAULT '{}',
  contributor_name TEXT NOT NULL,
  contributor_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folder_prompts (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES prompt_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: public read, public insert (same pattern as existing tables)
ALTER TABLE prompt_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_folders_public_read" ON prompt_folders FOR SELECT USING (true);
CREATE POLICY "prompt_folders_public_insert" ON prompt_folders FOR INSERT WITH CHECK (true);
CREATE POLICY "folder_prompts_public_read" ON folder_prompts FOR SELECT USING (true);
CREATE POLICY "folder_prompts_public_insert" ON folder_prompts FOR INSERT WITH CHECK (true);

-- Auto-update updated_at on prompt_folders
CREATE OR REPLACE FUNCTION update_prompt_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_folders_updated_at
  BEFORE UPDATE ON prompt_folders
  FOR EACH ROW EXECUTE FUNCTION update_prompt_folders_updated_at();
