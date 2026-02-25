-- Prodigi print fulfillment: track status and Prodigi order ID
-- Also store print dimensions for art_print order items

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS prodigi_order_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_prodigi_order_id
  ON orders(prodigi_order_id) WHERE prodigi_order_id IS NOT NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS print_dimensions VARCHAR(30);

COMMENT ON COLUMN orders.fulfillment_status IS 'pending, processing, shipped, delivered, cancelled';
COMMENT ON COLUMN order_items.print_dimensions IS 'Art print size e.g. 8x10, 12x16';
