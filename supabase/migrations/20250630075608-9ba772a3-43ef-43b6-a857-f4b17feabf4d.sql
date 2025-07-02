
-- Add is_global column to rewards table
ALTER TABLE public.rewards 
ADD COLUMN is_global boolean NOT NULL DEFAULT false;

-- Create an index on is_global for better query performance
CREATE INDEX idx_rewards_is_global ON public.rewards(is_global);

-- Update any existing rewards to be company-specific (not global) by default
-- This ensures backward compatibility
UPDATE public.rewards 
SET is_global = false 
WHERE is_global IS NULL;
