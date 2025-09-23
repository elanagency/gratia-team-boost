-- Add policy to allow public read access to gift cards catalog
CREATE POLICY "Anyone can view gift cards catalog" ON public.goody_gift_cards
FOR SELECT 
USING (true);