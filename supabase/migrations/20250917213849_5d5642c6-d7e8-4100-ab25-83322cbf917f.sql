-- Enable real-time updates for point_transactions table
ALTER TABLE public.point_transactions REPLICA IDENTITY FULL;

-- Add point_transactions to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;