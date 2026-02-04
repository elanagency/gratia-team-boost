-- Create junction table for company regions (many-to-many)
CREATE TABLE public.company_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  region_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, region_code)
);

-- Enable RLS
ALTER TABLE public.company_regions ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all company regions
CREATE POLICY "Platform admins can manage all company regions"
  ON public.company_regions FOR ALL
  USING (public.is_platform_admin());

-- Company admins can view their regions
CREATE POLICY "Company admins can view their regions"
  ON public.company_regions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid() AND status = 'active'
  ));

-- Company members can view their regions
CREATE POLICY "Company members can view their regions"
  ON public.company_regions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid() AND status = 'active'
  ));

-- Indexes for performance
CREATE INDEX idx_company_regions_company_id ON public.company_regions(company_id);
CREATE INDEX idx_company_regions_region_code ON public.company_regions(region_code);