
-- Add universal monthly limit column to companies table
ALTER TABLE public.companies 
ADD COLUMN team_member_monthly_limit integer DEFAULT 0;

-- Create table to track monthly spending per member
CREATE TABLE public.member_monthly_spending (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  month_year text NOT NULL, -- Format: "2024-01"
  points_spent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, month_year)
);

-- Enable RLS on the new table
ALTER TABLE public.member_monthly_spending ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for member_monthly_spending
CREATE POLICY "Users can view their own monthly spending" 
  ON public.member_monthly_spending 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can view all member spending" 
  ON public.member_monthly_spending 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE company_id = member_monthly_spending.company_id 
    AND user_id = auth.uid() 
    AND is_admin = true
  ));

CREATE POLICY "System can insert spending records" 
  ON public.member_monthly_spending 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update spending records" 
  ON public.member_monthly_spending 
  FOR UPDATE 
  USING (true);

-- Create function to get current month spending for a user
CREATE OR REPLACE FUNCTION public.get_user_monthly_spending(user_id uuid, company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(points_spent, 0)
  FROM public.member_monthly_spending
  WHERE user_id = $1 
    AND company_id = $2 
    AND month_year = to_char(now(), 'YYYY-MM');
$$;

-- Create function to update monthly spending
CREATE OR REPLACE FUNCTION public.update_monthly_spending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Insert or update monthly spending record
  INSERT INTO public.member_monthly_spending (user_id, company_id, month_year, points_spent)
  VALUES (NEW.sender_id, NEW.company_id, current_month, NEW.points)
  ON CONFLICT (user_id, company_id, month_year)
  DO UPDATE SET 
    points_spent = member_monthly_spending.points_spent + NEW.points,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to track monthly spending when points are given
CREATE TRIGGER track_monthly_spending_trigger
  AFTER INSERT ON public.point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_spending();

-- Create function to check if user can spend points (for team members)
CREATE OR REPLACE FUNCTION public.can_user_spend_points(user_id uuid, company_id uuid, points_to_spend integer)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.company_members 
        WHERE company_id = $2 AND user_id = $1 AND is_admin = true
      ) THEN true  -- Admins have no spending limits
      ELSE 
        COALESCE(
          (SELECT team_member_monthly_limit FROM public.companies WHERE id = $2), 0
        ) >= (
          public.get_user_monthly_spending($1, $2) + $3
        )
    END;
$$;
