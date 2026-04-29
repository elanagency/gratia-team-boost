## Problem

Your client tried to redeem an Amazon.com gift card for **$5.00 / 100 points** and saw a generic "Edge Function returned a non-2xx status code" toast instead of a clear reason.

Two issues are happening:

### 1. The real reason: Amazon.com has a $10 USD minimum
Giftbit's Amazon.com brand does not allow redemptions below $10. Looking at your redemption history, every successful Amazon redemption has been $15 or $20 — none have ever succeeded at $5. The Giftbit API returns a 422 rejecting the request.

### 2. The error message is unhelpful
The edge function correctly catches the Giftbit error and returns a friendly message like *"This gift card brand does not support the selected amount."* — but the frontend modal isn't reading it. When Supabase's `functions.invoke()` gets a non-2xx response, the friendly payload is hidden inside `error.context`, and our code just throws the raw error, so the user sees the generic Supabase wrapper message.

## Plan

### A. Surface the real error in the modal
**File:** `src/components/team/GiftCardModal.tsx`

Update the `handleRedeem` catch path so that when `supabase.functions.invoke` returns an error, we attempt to read the JSON body from `error.context` (a `Response` object) and show the `error` field from our edge function's payload. Fall back to the original message only if parsing fails.

Result: instead of "Edge Function returned a non-2xx status code", the user sees "This gift card brand does not support the selected amount. Please try a different amount."

### B. Add client-side minimum validation
**File:** `src/components/team/GiftCardModal.tsx`

Add a soft minimum check before sending to the edge function. Show an inline helper note under the amount inputs showing the brand's accepted range when known. Since `min_price_in_cents` / `max_price_in_cents` aren't currently populated for most brands in the database, we'll:

1. Read `reward.min_price_in_cents` and `reward.max_price_in_cents` if present and show them as a helper line ("Minimum: $X — Maximum: $Y").
2. Block the Confirm button (and show inline error) when the entered dollar amount is below the minimum or above the maximum.
3. Keep the edge-function error fallback for brands where we don't have min/max data.

### C. (Optional, recommended) Improve the Giftbit error mapping
**File:** `supabase/functions/giftbit-redemption-service/index.ts`

The current handler only maps `ERROR_CAMPAIGN_INVALID_BRAND`. Extend the parser to also detect Giftbit's "price out of range" / minimum-amount errors and return an even clearer message like *"Amazon.com requires a minimum of $10. Please increase the amount."* when the API includes a min/max in its error response.

## Out of scope

- We are **not** changing the edge function's points-deduction logic, redemption flow, or DB schema.
- We are **not** re-syncing the Giftbit catalog to populate min/max values — that's a separate task. If you'd like, I can follow up with a plan to refresh `giftbit_brands` so every brand has accurate min/max stored.

## Why the client hit this now

The new "available balance" card and the points-input redesign make it easier than ever to enter small amounts like $5 (100 points). Before, the dollar input was less visible. So the underlying Giftbit minimum has always existed; it just wasn't being hit as often.
