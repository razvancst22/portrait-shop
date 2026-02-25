-- Add reference_image_urls for multi-photo family and couple portraits.
-- Stores 2-6 URLs (family) or 2 URLs (couple); null for single-image categories.
ALTER TABLE generations ADD COLUMN IF NOT EXISTS reference_image_urls JSONB;
