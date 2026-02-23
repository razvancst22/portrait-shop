-- Pack purchases: tracks Digital Pack credits (generations + high-res downloads)
-- Used when user buys Starter/Creator/Artist pack. Requires user_id (sign-in).

CREATE TABLE pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  pack_type VARCHAR(20) NOT NULL CHECK (pack_type IN ('starter', 'creator', 'artist')),
  generations_granted INTEGER NOT NULL,
  generations_used INTEGER NOT NULL DEFAULT 0,
  downloads_granted INTEGER NOT NULL,
  downloads_used INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pack_purchases_user ON pack_purchases(user_id);
CREATE INDEX idx_pack_purchases_order ON pack_purchases(order_id);
