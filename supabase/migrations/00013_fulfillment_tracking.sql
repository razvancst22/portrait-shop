-- Add fulfillment and tracking columns for physical orders (Printful).
-- Printful webhook updates these when package_shipped fires.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
