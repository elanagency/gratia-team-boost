-- Add invitation status tracking to company_members table
ALTER TABLE public.company_members 
ADD COLUMN invitation_status text NOT NULL DEFAULT 'invited' CHECK (invitation_status IN ('invited', 'active')),
ADD COLUMN first_login_at timestamp with time zone DEFAULT NULL;

-- Create index for better performance on status queries
CREATE INDEX idx_company_members_invitation_status ON public.company_members(invitation_status);

-- Update existing members to 'active' status (they're already using the system)
UPDATE public.company_members 
SET invitation_status = 'active', first_login_at = created_at
WHERE invitation_status = 'invited';