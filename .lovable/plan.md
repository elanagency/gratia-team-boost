

# Fix: Company Deletion Failing

## Problem

The `delete-company` edge function was **never deployed**, so every call returned a 404/error. Additionally, the function is missing cleanup for several tables with `company_id` data, which could cause orphaned records.

## Solution

### 1. Deploy the edge function (already done)

The function has now been deployed. This alone should fix the immediate "Failed to delete company" error.

### 2. Update `supabase/functions/delete-company/index.ts` to clean up ALL related tables

The current function only deletes from 3 tables before removing the company. It needs to also clean up:

- `celebration_rewards_log`
- `company_point_transactions`
- `company_regions`
- `departments`
- `login_events`
- `redemptions`
- `slack_integrations`
- `teams_integrations`

The updated deletion sequence (lines 136-150) will be:

```typescript
const deletions = [
  // Delete integration records
  supabase.from('slack_integrations').delete().eq('company_id', companyId),
  supabase.from('teams_integrations').delete().eq('company_id', companyId),
  
  // Delete point and transaction records
  supabase.from('monthly_points_allocations').delete().eq('company_id', companyId),
  supabase.from('point_transactions').delete().eq('company_id', companyId),
  supabase.from('company_point_transactions').delete().eq('company_id', companyId),
  supabase.from('celebration_rewards_log').delete().eq('company_id', companyId),
  
  // Delete redemptions and login events
  supabase.from('redemptions').delete().eq('company_id', companyId),
  supabase.from('login_events').delete().eq('company_id', companyId),
  
  // Delete company structure records
  supabase.from('subscription_events').delete().eq('company_id', companyId),
  supabase.from('company_regions').delete().eq('company_id', companyId),
  supabase.from('departments').delete().eq('company_id', companyId),
  
  // Deactivate profiles (already backed up)
  supabase.from('profiles').update({ status: 'deactivated' }).eq('company_id', companyId),
  
  // Finally delete the company
  supabase.from('companies').delete().eq('id', companyId),
]
```

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/delete-company/index.ts` | Add missing table cleanups for all 8 additional tables with `company_id` |

## Impact

- Company deletion will work immediately (function is now deployed)
- All related data will be properly cleaned up, preventing orphaned records
- User data is still backed up to `backup_users` before deletion

