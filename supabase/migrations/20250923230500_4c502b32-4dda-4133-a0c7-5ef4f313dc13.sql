-- Add dollar_amount column to redemptions table to store the dollar amount selected for variable-price gift cards
ALTER TABLE public.redemptions 
ADD COLUMN dollar_amount DECIMAL(10,2);