-- Add structured_message column to point_transactions table to store HTML content
ALTER TABLE public.point_transactions 
ADD COLUMN structured_message text;