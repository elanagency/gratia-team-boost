

## Fix Company Deletion — Two Issues Found

### Issue 1: Wrong deletion order causes FK constraint violations

The edge function deletes auth users (step 2) before deleting `point_transactions` and `celebration_rewards_log` (step 3). Deleting auth users cascades to delete `profiles`, but `point_transactions` has FK references to `profiles` (`sender_profile_id`, `recipient_profile_id`) and `celebration_rewards_log` has a FK to `profiles` (`profile_id`). Without `ON DELETE CASCADE` on those FKs, the profile deletion is blocked.

**Fix**: Move auth user deletion to AFTER all related table deletions, not before.

### Issue 2: Missing config.toml entry

The `delete-company` function has no entry in `supabase/config.toml`. It needs `verify_jwt = true` to be explicitly configured.

### Changes

**`supabase/functions/delete-company/index.ts`** — Restructure deletion order:

1. Delete `point_transactions` (references profiles)
2. Delete `celebration_rewards_log` (references profiles)
3. Delete `redemptions`, `login_events`, `monthly_points_allocations`, `company_point_transactions`
4. Delete integrations (`slack_integrations`, `teams_integrations`)
5. Delete `subscription_events`, `company_regions`, `departments`
6. Delete `platform_product_blacklist` entries by users in this company
7. Update profiles to `deactivated`
8. Delete auth users (NOW safe — no FKs block profile cascade)
9. Delete company

Also add proper error logging with the specific step that failed.

**`supabase/config.toml`** — Add:
```toml
[functions.delete-company]
verify_jwt = true
```

**Redeploy** the edge function after changes.

