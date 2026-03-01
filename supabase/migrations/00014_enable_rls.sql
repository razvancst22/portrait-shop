-- Enable Row Level Security (RLS) on all public tables.
-- All data access in this app goes through API routes using the service role key,
-- which bypasses RLS. No permissive policies for anon = direct client access blocked.
-- Ensure SUPABASE_SERVICE_ROLE_KEY is set in production and dev.

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_generation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_purchases ENABLE ROW LEVEL SECURITY;
