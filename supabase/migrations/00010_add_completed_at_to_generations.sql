-- Add completed_at for 1-hour discount countdown (from generation completion)
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Backfill: for already-completed generations, use updated_at as approximation
UPDATE generations
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;
