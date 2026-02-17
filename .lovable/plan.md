

# Fix: Invited Admin Members Not Counted in Billing

## Problem

When a team member is invited with the "Admin" role, they are set with `is_admin = true` in the database. The billing count function `get_stripe_active_member_count` only counts members where `is_admin = false`, so these invited admins are completely invisible to billing. The subscription quantity never updates, and no proration charge is created.

## Root Cause

The DB function `get_stripe_active_member_count` filters `AND is_admin = false`. The billing logic then does `count + 1` to account for the company owner. This means:
- Original company owner: counted via the `+1`
- Invited members with role "user" (`is_admin = false`): counted by the function
- Invited members with role "admin" (`is_admin = true`): **not counted at all** -- this is the bug

## Solution

Change the billing count approach: count **all** active members in the company (regardless of `is_admin`), and remove the `+1` offset. This ensures every active member is billable, including:
- The original company owner (admin)
- Invited team members (user role)
- Invited team members (admin role)

### Changes

**1. Database migration -- Update `get_stripe_active_member_count`**

Remove the `AND is_admin = false` filter so the function counts ALL active members:

```sql
CREATE OR REPLACE FUNCTION public.get_stripe_active_member_count(company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 
  AND status = 'active';
$$;
```

**2. `supabase/functions/update-subscription/index.ts`**

Remove the `+1` offset on line 87. Change:
```
const adjustedQuantity = (actualMemberCount || 0) + 1;
```
to:
```
const adjustedQuantity = actualMemberCount || 0;
```

**3. `supabase/functions/billing-activate-on-first-login/index.ts`**

Remove the `+1` offset on line 44. Change:
```
const totalBillableSeats = (activeSeats || 0) + 1;
```
to:
```
const totalBillableSeats = activeSeats || 0;
```

**4. `src/context/AuthContext.tsx`**

No changes needed -- this file just passes the count to the edge function; the `+1` logic lives in the edge functions.

## Impact

- All active members (admin or not) will be counted as billable seats
- The company owner is no longer manually added as `+1` -- they're included in the count naturally since they have `status = 'active'`
- Existing subscriptions will reflect the correct count on the next update

## Files Modified

| File | Change |
|------|--------|
| New migration SQL | Update `get_stripe_active_member_count` to remove `is_admin = false` filter |
| `supabase/functions/update-subscription/index.ts` | Remove `+ 1` from `adjustedQuantity` |
| `supabase/functions/billing-activate-on-first-login/index.ts` | Remove `+ 1` from `totalBillableSeats` |

