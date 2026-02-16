-- Abuse prevention: cap free generations per IP and per device in a 30-day window.
-- We store hashed IP and hashed device (User-Agent etc.) so we don't store raw PII.

CREATE TABLE free_generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  device_key TEXT,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_free_generation_usage_ip_used ON free_generation_usage (ip_hash, used_at DESC);
CREATE INDEX idx_free_generation_usage_device_used ON free_generation_usage (device_key, used_at DESC) WHERE device_key IS NOT NULL;

-- Optional: periodic cleanup of rows older than 30 days (run via cron or Edge Function)
-- DELETE FROM free_generation_usage WHERE used_at < NOW() - INTERVAL '30 days';
