-- Create backup_users table for storing user data before deletion
CREATE TABLE public.backup_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_user_id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company_name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  department TEXT,
  role TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for backup_users table
ALTER TABLE public.backup_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform admins only
CREATE POLICY "Platform admins can view backup users" 
  ON public.backup_users FOR SELECT 
  USING (is_platform_admin());

CREATE POLICY "Platform admins can insert backup users" 
  ON public.backup_users FOR INSERT 
  WITH CHECK (is_platform_admin());

-- Create index for performance
CREATE INDEX idx_backup_users_original_user_id ON public.backup_users(original_user_id);
CREATE INDEX idx_backup_users_company_name ON public.backup_users(company_name);
CREATE INDEX idx_backup_users_deleted_at ON public.backup_users(deleted_at);