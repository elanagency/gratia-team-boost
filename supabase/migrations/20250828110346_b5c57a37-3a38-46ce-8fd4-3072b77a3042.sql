-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up cron job for monthly points allocation
-- This will run daily at 8 AM UTC and check which companies need monthly allocation
SELECT cron.schedule(
  'monthly-points-allocation',
  '0 8 * * *', -- Every day at 8 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/monthly-points-allocation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamNqdHljbWZkamZuZHV4aXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjIwMDYsImV4cCI6MjA2MjI5ODAwNn0.eo_nQdvnNFpu8bHJF_e2o2a_9R1POkQRydgtuxyJvvI"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);