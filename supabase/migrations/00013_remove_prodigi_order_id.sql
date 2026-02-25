-- Remove Prodigi-specific column (Printful uses external_id for order linking)
DROP INDEX IF EXISTS idx_orders_prodigi_order_id;
ALTER TABLE orders DROP COLUMN IF EXISTS prodigi_order_id;
