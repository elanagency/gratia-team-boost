-- Enable real-time for goody_gift_cards table
ALTER TABLE public.goody_gift_cards REPLICA IDENTITY FULL;

-- Enable real-time for companies table (for environment changes)
ALTER TABLE public.companies REPLICA IDENTITY FULL;

-- Enable real-time for platform_product_blacklist table
ALTER TABLE public.platform_product_blacklist REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.goody_gift_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_product_blacklist;