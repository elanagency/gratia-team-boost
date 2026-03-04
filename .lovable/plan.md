

## Fix: Clear `department_id` before deleting departments

The logs show: `"departments" violates foreign key constraint "profiles_department_id_fkey" on table "profiles"`. Profiles still reference departments via `department_id` when we try to delete them.

The profile deactivation step (which sets `company_id = null`) currently runs AFTER the departments deletion. It also doesn't clear `department_id`.

### Change — `supabase/functions/delete-company/index.ts`

Move the profile deactivation step to BEFORE the departments deletion, and also set `department_id: null`:

```typescript
.update({ status: 'deactivated', company_id: null, department_id: null })
```

The updated deletion order becomes:
1. Backup users
2. Delete `point_transactions`, `celebration_rewards_log`
3. Delete `redemptions`, `login_events`, `monthly_points_allocations`, `company_point_transactions`
4. Delete `slack_integrations`, `teams_integrations`
5. Delete `subscription_events`, `company_regions`
6. Delete `platform_product_blacklist`
7. **Deactivate profiles** (set `company_id`, `department_id` to null) — moved UP
8. Delete `departments` — now safe
9. Delete auth users
10. Delete company

Redeploy the edge function after changes.

