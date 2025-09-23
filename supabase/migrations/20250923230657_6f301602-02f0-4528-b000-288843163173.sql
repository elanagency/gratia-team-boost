-- Add price_is_variable column to goody_gift_cards table to track which products support variable pricing
ALTER TABLE public.goody_gift_cards 
ADD COLUMN price_is_variable BOOLEAN NOT NULL DEFAULT false;