

# Fix: Billing Update Skipped for Admin Members on Login

## Problem

The billing fix we deployed (DB function + edge function changes) is correct, but the billing update is **never triggered** for admin members. In `AuthContext.tsx`, both login paths (invited user becoming active, and first-login for active users) have a guard:

```typescript
if (profile.company_id && !profile.is_admin) {
```

This means when an invited admin logs in for the first time, the code never calls `billing-activate-on-first-login` or `update-subscription`. The Stripe subscription stays at its old quantity.

## Root Cause

The original assumption was that only non-admin team members should trigger billing updates. But since invited admins are also billable seats, they need to trigger the same billing flow.

## Solution

Remove the `!profile.is_admin` guard from both login paths in `AuthContext.tsx`. The billing functions themselves already correctly count all active members, so we just need to ensure they actually get called.

### Changes

**`src/context/AuthContext.tsx`**

Two lines need to change:

1. **Line 168** (invited user becoming active path):
   - Change: `if (profile.company_id && !profile.is_admin)`
   - To: `if (profile.company_id)`

2. **Line 227** (first-login for active users path):
   - Change: `if (profile.company_id && !profile.is_admin)`
   - To: `if (profile.company_id)`

## Impact

- When any user (admin or non-admin) logs in for the first time, the system will check the company subscription and update the seat count
- The DB function already counts all active members correctly, so the Stripe quantity will be updated properly
- No edge function changes needed -- this is purely a frontend trigger fix

## Files Modified

| File | Change |
|------|--------|
| `src/context/AuthContext.tsx` | Remove `!profile.is_admin` guard from both billing trigger paths (lines 168 and 227) |

