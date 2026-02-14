-- Guest token usage: track how many of the 2 free tokens a guest has used.
-- guest_id is stored in a cookie; tokens_used 0..2; remaining = 2 - tokens_used.

CREATE TABLE guest_token_usage (
  guest_id UUID PRIMARY KEY,
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0 AND tokens_used <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER guest_token_usage_updated_at
  BEFORE UPDATE ON guest_token_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
