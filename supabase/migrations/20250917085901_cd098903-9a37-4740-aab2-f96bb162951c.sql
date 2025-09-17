-- Create departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_department_name_per_company UNIQUE (company_id, name, is_active)
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Company members can view their company departments"
ON public.departments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = departments.company_id
    AND profiles.is_active = true
  )
);

CREATE POLICY "Company admins can manage their company departments"
ON public.departments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = departments.company_id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = departments.company_id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
);

CREATE POLICY "Platform admins can view all departments"
ON public.departments
FOR SELECT
USING (is_platform_admin());

CREATE POLICY "Platform admins can manage all departments"
ON public.departments
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Add department_id column to profiles table
ALTER TABLE public.profiles ADD COLUMN department_id uuid REFERENCES public.departments(id);

-- Create function to update department updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_department_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for department updates
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_department_updated_at();

-- Migrate existing departments from profiles.department to departments table
INSERT INTO public.departments (name, company_id)
SELECT DISTINCT 
  department as name, 
  company_id
FROM public.profiles 
WHERE department IS NOT NULL 
  AND department != '' 
  AND company_id IS NOT NULL
ON CONFLICT (company_id, name, is_active) DO NOTHING;

-- Update profiles to reference the new departments table
UPDATE public.profiles 
SET department_id = d.id
FROM public.departments d
WHERE profiles.department = d.name 
  AND profiles.company_id = d.company_id
  AND profiles.department IS NOT NULL;

-- Create index for better performance
CREATE INDEX idx_departments_company_id ON public.departments(company_id);
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);