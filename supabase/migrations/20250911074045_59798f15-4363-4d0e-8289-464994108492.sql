-- Fix critical security issues: Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_monthly_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_points_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;