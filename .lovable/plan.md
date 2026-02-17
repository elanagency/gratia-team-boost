

# Fix: BillingCard Showing Stale Seat Count

## Problem

The BillingCard component has the same bug we already fixed in the backend:
- Line 124: queries profiles with `.eq('is_admin', false)`, excluding admin members from the count
- Line 368: adds `+ 1` to display the "Active seats" number
- Line 382: adds `+ 1` when calculating the displayed monthly cost

This means the UI always shows the old count (non-admin members + 1) instead of the actual total of all active members.

## Solution

Apply the same fix pattern used in the edge functions:

### `src/components/settings/BillingCard.tsx`

1. **Remove `.eq('is_admin', false)`** from the profiles query (line 124) so it counts ALL active members
2. **Remove `+ 1`** from the Active seats display (line 368)
3. **Remove `+ 1`** from the Monthly cost calculation (line 382)
4. **Update label** from "Includes admin seat" to "All active members" since the count now naturally includes admins

| Line | Current | New |
|------|---------|-----|
| 124 | `.eq('is_admin', false)` | (remove this line) |
| 368 | `(subscriptionStatus?.team_members \|\| 0) + 1` | `subscriptionStatus?.team_members \|\| 0` |
| 371 | `'Includes admin seat'` | `'All active members'` |
| 382 | `(((subscriptionStatus?.team_members \|\| 0) + 1) * memberPriceInCents / 100)` | `((subscriptionStatus?.team_members \|\| 0) * memberPriceInCents / 100)` |

### Also fix `src/components/settings/SubscriptionStatusCard.tsx`

This component has the same issue (lines 79-83 query with `is_admin = false`, and the display uses a separate calculation). Remove the filter there too for consistency.

