-- Add user_id to orders for reliable order history when user is logged in at checkout.
-- Nullable for backward compatibility (guest checkout, legacy orders).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders(user_id) WHERE user_id IS NOT NULL;
