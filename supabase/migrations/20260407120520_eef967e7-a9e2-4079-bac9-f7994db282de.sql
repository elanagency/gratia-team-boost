
CREATE TABLE public.company_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#7F2BFE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view values" ON public.company_values FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company admins can manage values" ON public.company_values FOR ALL USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Platform admins can manage all values" ON public.company_values FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());

ALTER TABLE public.point_transactions ADD COLUMN company_value_id uuid REFERENCES public.company_values(id);
