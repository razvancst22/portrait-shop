-- Add pet_name to generations for email marketing (collected during loading)
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS pet_name VARCHAR(255);
