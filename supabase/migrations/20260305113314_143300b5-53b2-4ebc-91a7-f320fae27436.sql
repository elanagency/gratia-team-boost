ALTER TABLE public.profiles ADD COLUMN slack_user_id TEXT;
CREATE UNIQUE INDEX idx_profiles_slack_user_id ON public.profiles (slack_user_id) WHERE slack_user_id IS NOT NULL;