

# Phase 3: Daily Celebration Rewards Processing

## Overview

Create a new edge function `process-celebration-rewards` that runs daily via `pg_cron`, checking all companies with celebrations enabled and distributing birthday/anniversary points automatically.

## How It Works

1. The function runs once daily (scheduled at 9:00 AM UTC via `pg_cron`)
2. It queries all companies where `birthday_rewards_enabled = true` OR `anniversary_rewards_enabled = true`
3. For each company, it finds active employees whose `birthday` (month/day) or `company_start_date` (month/day) matches today
4. It checks `celebration_rewards_log` to skip anyone already rewarded this year for that event type
5. For each eligible employee: verifies the company has enough `points_balance`, deducts from wallet, credits the employee's `points`, logs to `celebration_rewards_log`, and creates a `point_transactions` record
6. If the wallet runs out mid-processing, remaining employees are skipped and logged as "insufficient_balance"

## New Edge Function: `process-celebration-rewards/index.ts`

**Logic flow per company:**

```text
For each company with celebrations enabled:
  +-- Birthday rewards enabled?
  |     Find active profiles where EXTRACT(month, day) from birthday = today
  |     Filter out those already in celebration_rewards_log for this year
  |     For each match:
  |       Check company.points_balance >= birthday_reward_points
  |       Deduct from company points_balance
  |       Add to profile.points (redeemable)
  |       Insert celebration_rewards_log entry
  |       Insert point_transactions record (sender = null, system reward)
  |
  +-- Anniversary rewards enabled?
        Same logic using company_start_date instead of birthday
        (Skip if company_start_date is today's date in the current year -- that means they just started, not an anniversary)
```

**Key details:**
- Uses service role key (no user auth needed since it is a cron job)
- `verify_jwt = false` in config.toml (called by pg_cron, not by a user)
- `point_transactions` entry uses `sender_profile_id = NULL` and description like "Birthday reward" or "Work anniversary reward" to distinguish system-generated rewards
- Anniversary logic skips employees whose `company_start_date` year equals the current year (they just started, no anniversary yet)

## Config Changes

Add to `supabase/config.toml`:
```toml
[functions.process-celebration-rewards]
verify_jwt = false
```

## pg_cron Setup

A SQL statement (run via the Supabase SQL editor, not a migration) to schedule the daily job:

```sql
SELECT cron.schedule(
  'process-celebration-rewards-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/process-celebration-rewards',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon-key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

This will be provided as a ready-to-run SQL snippet using the project's actual URL and anon key.

## File Summary

| File | Action |
|------|--------|
| `supabase/functions/process-celebration-rewards/index.ts` | New edge function |
| `supabase/config.toml` | Add `verify_jwt = false` for the new function |

After deployment, the pg_cron SQL will be run to schedule the daily execution.

