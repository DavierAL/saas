-- Migration: Add enriched fields to items table
-- Date: 2026-05-10
-- Description: Add SKU, barcode, image, cost, brand, category, variant, weight, min_stock, description, expiry fields

BEGIN;

-- Add new columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost INTEGER;  -- stored as integer cents
ALTER TABLE items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS variant TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS weight_quantity TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS has_expiry BOOLEAN DEFAULT FALSE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_comments TEXT;

-- Create index for faster SKU/barcode lookups
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_brand ON items(brand) WHERE brand IS NOT NULL;

COMMIT;