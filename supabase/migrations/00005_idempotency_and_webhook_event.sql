-- Idempotency key for POST /api/generate (optional client key; duplicate requests return 409 with existing generationId)
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generations_idempotency_key
  ON generations(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Stripe webhook: store event id so we skip duplicate delivery for the same event
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_webhook_event_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_webhook_event_id
  ON orders(stripe_webhook_event_id) WHERE stripe_webhook_event_id IS NOT NULL;
