

## Fix: Drop Redundant Database Function Overload

### Problem

The "Recipient is not a member of this company" error in the screenshot is actually caused by the RPC call failing before it reaches the transfer logic. The edge function logs confirm it's still the same PGRST203 overload error -- passing `transfer_gif_url: null` doesn't help PostgREST disambiguate between two function signatures.

Two versions exist in the database:
- `transfer_points_between_users(sender_user_id, recipient_user_id, transfer_company_id, points_amount, transfer_description)` -- 5 params
- `transfer_points_between_users(sender_user_id, recipient_user_id, transfer_company_id, points_amount, transfer_description, transfer_gif_url DEFAULT NULL)` -- 6 params

### Fix

Create a migration to drop the 5-parameter version. The 6-parameter version already defaults `transfer_gif_url` to `NULL`, so all existing callers (dashboard, slash command, modal) will continue working without changes.

### Implementation

**1. New migration file**

```sql
DROP FUNCTION IF EXISTS public.transfer_points_between_users(uuid, uuid, uuid, integer, text);
```

This removes only the 5-param overload and keeps the 6-param version intact.

**No edge function changes needed** -- the `transfer_gif_url: null` param is already being passed.

