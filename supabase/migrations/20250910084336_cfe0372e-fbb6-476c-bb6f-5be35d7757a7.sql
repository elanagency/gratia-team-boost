-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing monthly allocation cron jobs
SELECT cron.unschedule('monthly-points-allocation') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monthly-points-allocation'
);

-- Schedule monthly points allocation to run on the 1st of every month at 9:00 AM UTC
SELECT cron.schedule(
  'monthly-points-allocation',
  '0 9 1 * *', -- At 9:00 AM on the 1st of every month
  $$
  select
    net.http_post(
        url:='https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/monthly-points-allocation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamNqdHljbWZkamZuZHV4aXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjIwMDYsImV4cCI6MjA2MjI5ODAwNn0.eo_nQdvnNFpu8bHJF_e2o2a_9R1POkQRydgtuxyJvvI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);