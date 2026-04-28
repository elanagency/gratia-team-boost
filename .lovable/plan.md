# Fix "Failed to give points" on Quick Add Points

## Root cause
The Postgres database currently has **two overloads** of `transfer_points_between_users`:

1. 6-arg version: `(sender_user_id, recipient_user_id, transfer_company_id, points_amount, transfer_description, transfer_gif_url DEFAULT NULL)`
2. 7-arg version: `(sender_user_id, recipient_user_id, transfer_company_id, points_amount, transfer_description, transfer_gif_url DEFAULT NULL, transfer_image_url DEFAULT NULL)`

The 7-arg version was added in migration `20260422101156` to support image attachments, but the older 6-arg version was never dropped. They both exist side-by-side.

When the **Quick Add Points** button in the recognition feed (`RecognitionFeed.tsx`, line 394) calls the RPC with only 5 named parameters, PostgREST cannot decide which overload to dispatch to (both match), so the call fails — surfacing the generic "Failed to give points. Please try again." toast.

The main composer's Give Points call works because it explicitly passes all 7 parameters, which uniquely matches the 7-arg overload.

This also affects every other call site that omits the gif/image params — Slack/Teams interactions, the goody webhook refund, etc.

## Fix

### 1. Drop the redundant 6-arg overload (migration)
```sql
DROP FUNCTION IF EXISTS public.transfer_points_between_users(
  uuid, uuid, uuid, integer, text, text
);
```

The 7-arg version already covers every existing call site because both the gif and image parameters default to NULL.

### 2. No code changes needed
After dropping the duplicate, the existing Quick Add call (and every other 5/6-arg caller) will resolve unambiguously to the 7-arg function and start working again.

## Files
- New migration: `supabase/migrations/<timestamp>_drop_legacy_transfer_points_overload.sql`

## Verification
- After the migration, `SELECT pg_get_function_arguments(oid) FROM pg_proc WHERE proname='transfer_points_between_users'` should return exactly one row.
- Quick Add Points (+1/+5/+10) on any feed post where the current user is neither sender nor recipient should succeed and decrement the sender's monthly points.

## Notes
- No frontend changes — this is a pure DB cleanup that restores the documented 6-parameter signature contract (the 7th param is just an additional optional field).
- Matches the project memory rule that `transfer_points_between_users` has a single unified signature.
