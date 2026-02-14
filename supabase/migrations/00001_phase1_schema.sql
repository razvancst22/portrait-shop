-- Phase 1 schema: orders, order_items, order_deliverables, generations
-- No pricing_strategy, no artelo_* tables, no users table (guest checkout only)

-- ============================================
-- GENERATIONS (must exist before order_items)
-- ============================================
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Guest association (no auth in Phase 1)
  session_id VARCHAR(255),

  -- Input details
  original_image_url TEXT NOT NULL,
  art_style VARCHAR(50) NOT NULL,
  subject_type VARCHAR(20) DEFAULT 'pet_dog',

  -- AI generation details
  midjourney_job_id VARCHAR(255),
  midjourney_prompt TEXT NOT NULL,
  midjourney_model VARCHAR(50) DEFAULT 'v7',

  -- Output URLs
  preview_image_url TEXT,
  upscaled_image_url TEXT,
  final_image_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  generation_time_seconds INTEGER,
  error_message TEXT,

  -- Cost tracking
  generation_cost_usd DECIMAL(6,4),

  -- Purchase tracking
  is_purchased BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generations_session ON generations(session_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_art_style ON generations(art_style);
CREATE INDEX idx_generations_created ON generations(created_at DESC);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,

  -- Customer (guest)
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),

  -- Pricing (Phase 1: digital only, fixed $10)
  subtotal_usd DECIMAL(10,2) NOT NULL,
  tax_amount_usd DECIMAL(10,2) DEFAULT 0,
  total_usd DECIMAL(10,2) NOT NULL,

  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),

  -- Phase 1 flow status
  status VARCHAR(30) DEFAULT 'pending_payment',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  product_type VARCHAR(50) NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,

  unit_price_usd DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  subtotal_usd DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_generation ON order_items(generation_id);

-- ============================================
-- ORDER DELIVERABLES (bundle files after purchase)
-- ============================================
CREATE TABLE order_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  asset_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_deliverables_order ON order_deliverables(order_id);

-- ============================================
-- updated_at trigger helper
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
