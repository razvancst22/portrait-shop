-- Rename Midjourney columns to neutral names (OpenAI / generic provider).
-- We only use OpenAI GPT Image API; remove Midjourney naming.

ALTER TABLE generations
  RENAME COLUMN midjourney_job_id TO job_id;

ALTER TABLE generations
  RENAME COLUMN midjourney_prompt TO prompt;

ALTER TABLE generations
  DROP COLUMN IF EXISTS midjourney_model;
