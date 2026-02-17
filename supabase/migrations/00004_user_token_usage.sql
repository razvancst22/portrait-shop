-- Per-user free token usage (logged-in users). Each account gets 2 free tokens.
-- When a user is signed in, credits come from here instead of guest_token_usage.

CREATE TABLE user_token_usage (
  user_id UUID PRIMARY KEY,
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0 AND tokens_used <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER user_token_usage_updated_at
  BEFORE UPDATE ON user_token_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE user_token_usage IS 'Free portrait usage per logged-in user (2 per account). Guest usage is in guest_token_usage.';
