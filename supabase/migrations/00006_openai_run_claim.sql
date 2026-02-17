-- Prevent duplicate OpenAI API calls when multiple status polls hit the same generation.
-- Only the first request to "claim" (set openai_run_started_at) runs the job; others just return status.

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS openai_run_started_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN generations.openai_run_started_at IS 'Set when a status poll starts the OpenAI run; ensures only one poll triggers the API.';
