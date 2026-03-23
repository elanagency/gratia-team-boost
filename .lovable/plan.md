

## Fix: RPC Function Overload Ambiguity

### Problem

The modal is opening successfully now. The error on submit is caused by a database function overload conflict. The logs show:

```
Could not choose the best candidate function between:
  transfer_points_between_users(..., transfer_description => text)
  transfer_points_between_users(..., transfer_description => text, transfer_gif_url => text)
```

There are two versions of `transfer_points_between_users` in the database — one with 5 params and one with 6 (including `transfer_gif_url`). When the edge function calls it with only 5 params, PostgREST cannot disambiguate.

### Fix

In `slack-interactions/index.ts`, explicitly pass `transfer_gif_url: null` in the RPC call so PostgREST resolves to the 6-parameter version.

### File Changed

| File | Change |
|------|--------|
| `supabase/functions/slack-interactions/index.ts` | Add `transfer_gif_url: null` to the `transfer_points_between_users` RPC call |

This is a one-line addition — no other changes needed.

