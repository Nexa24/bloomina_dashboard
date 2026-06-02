-- Run this in Supabase SQL Editor to add category hierarchy support
-- Adds: category_type, parent_id columns to the categories table

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'category'
    CHECK (category_type IN ('category', 'subcategory', 'universal')),
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add an index for fast parent lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);

-- Update existing rows: assign sensible defaults based on name patterns
-- Main categories
UPDATE categories SET category_type = 'category' 
  WHERE LOWER(name) IN ('bras', 'panties', 'nightwear', 'combo packs', 'tops', 'bottoms', 'accessories');

-- Universal / cross-cutting tags
UPDATE categories SET category_type = 'universal' 
  WHERE LOWER(name) IN ('sale%', 'bestsellers', 'innerwear', 'new arrivals', 'featured', 'trending');

-- Everything else defaults to subcategory (sub-collections) 
-- You can fine-tune manually or leave them as 'category'
