

## Fix: Clear Stale Slack IDs from Deactivated Profiles

### Problem
The deactivated Pedro profile still owns `slack_user_id = U09DCJAMA5Q`. A unique index (`idx_profiles_slack_user_id`) prevents assigning the same Slack ID to the active Pedro profile. This is exactly the stale-link issue identified earlier.

### Implementation

**1. Database migration** — Clear all Slack IDs from deactivated profiles:
```sql
UPDATE public.profiles
SET slack_user_id = NULL
WHERE status = 'deactivated' AND slack_user_id IS NOT NULL;
```

**2. Update `delete-company-member` edge function** — When deactivating a member, also clear their `slack_user_id` so this doesn't recur.

**3. Update `slack-auto-link` edge function** — Before manual linking, clear any stale `slack_user_id` on deactivated profiles for that Slack ID, so the unique constraint doesn't block the operation.

### Files changed

| File | Change |
|------|--------|
| New migration SQL | Clear stale `slack_user_id` on all deactivated profiles |
| `supabase/functions/delete-company-member/index.ts` | Set `slack_user_id = null` on deactivation |
| `supabase/functions/slack-auto-link/index.ts` | Clear stale links before manual link insert |

