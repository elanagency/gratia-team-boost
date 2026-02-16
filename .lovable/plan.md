

# Stripe Payment Improvements

## 1. Coupon Codes on Checkout

The `create-subscription-checkout` function already has `allow_promotion_codes: true` on line 261 -- so Stripe's built-in coupon/promo codes are already enabled for new subscription checkouts. However, the `billing-setup-checkout` function uses `mode: "setup"` (no payment), so coupon codes don't apply there.

**No code change needed** for coupon codes -- they're already working on the subscription checkout. If you want to verify, you can create a promo code in the Stripe Dashboard and test it at checkout.

## 2. Return to Correct Settings Tab After Stripe Redirect

Currently, the Stripe success/cancel URLs redirect to `/dashboard/settings` with no tab information. The `usePaymentVerification` hook also cleans the URL to `/dashboard/settings` after processing. The Settings page uses `defaultValue="company"` so it always resets to the Company tab.

### Changes

**`supabase/functions/billing-setup-checkout/index.ts`**
- Update `success_url` and `cancel_url` to include `tab=billing`:
  - `success_url`: `.../dashboard/settings?tab=billing&setup=success&session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: `.../dashboard/settings?tab=billing&setup=cancelled`

**`supabase/functions/create-subscription-checkout/index.ts`**
- Update `cancel_url` to include `tab=billing`:
  - `cancel_url`: `.../dashboard/settings?tab=billing&setup=cancelled`

**`src/hooks/usePaymentVerification.ts`**
- When cleaning the URL after verification, preserve the `tab` param:
  - `window.history.replaceState({}, '', '/dashboard/settings?tab=billing')`

**`src/pages/admin/Settings.tsx`**
- Read `tab` from URL search params and use it as the controlled/default value for the Tabs component instead of hardcoding `"company"`.

## 3. Investigate Live Account Error (pedro+dromo@grattia.com)

No logs were found for this specific error. The most likely cause is a mismatch between the company's `environment` field and the Stripe keys/price IDs being used. The `billing-setup-checkout` function uses the company's `environment` to pick the Stripe key, but the `verify-stripe-session` function uses the global `environment_mode` platform setting instead -- this mismatch can cause failures when verifying sessions created with a different key.

### Changes

**`supabase/functions/verify-stripe-session/index.ts`**
- Update `getStripeKey` to accept and use the **company's environment** (from the session metadata) instead of the global platform setting. This ensures the same Stripe key is used for both creating and verifying sessions.

## 4. Minimum 2 Seats (Include the Admin as a Billable User)

Currently, `get_stripe_active_member_count` only counts non-admin active members (`is_admin = false`). The billing flow uses this to set subscription quantity, meaning the admin (company owner) is never billed. Since the admin should also be a billable seat, the minimum should effectively be 2 when inviting the first team member (1 admin + 1 invitee).

### Changes

**`supabase/functions/billing-activate-on-first-login/index.ts`**
- After getting `activeSeats` from `get_stripe_active_member_count`, add 1 for the admin user:
  - `const totalBillableSeats = activeSeats + 1;`
- Use `totalBillableSeats` instead of `activeSeats` when creating the subscription quantity.

**`supabase/functions/create-subscription-checkout/index.ts`**
- When calculating the checkout quantity for new subscriptions, ensure the `teamSlots` value passed from the frontend already includes the admin, or add 1 here.
- For existing subscription updates, similarly use `adjustedQuantity + 1` pattern.

**`supabase/functions/update-subscription/index.ts`**
- After getting `actualMemberCount` from `get_stripe_active_member_count`, add 1 for the admin:
  - `const adjustedQuantity = (actualMemberCount || 0) + 1;`
- This ensures every subscription update also counts the admin as a seat.

**Alternative approach** (cleaner, single source of truth): Update the `get_stripe_active_member_count` database function itself to include the admin. However, this changes the semantics globally, so the safer approach is to add +1 in each edge function where the count is used for billing.

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `supabase/functions/billing-setup-checkout/index.ts` | Add `tab=billing` to redirect URLs |
| `supabase/functions/create-subscription-checkout/index.ts` | Add `tab=billing` to cancel URL |
| `src/hooks/usePaymentVerification.ts` | Preserve `tab` param when cleaning URL |
| `src/pages/admin/Settings.tsx` | Read `tab` from URL params for active tab |
| `supabase/functions/verify-stripe-session/index.ts` | Use company environment for Stripe key lookup |
| `supabase/functions/billing-activate-on-first-login/index.ts` | Add +1 for admin seat |
| `supabase/functions/update-subscription/index.ts` | Add +1 for admin seat |

