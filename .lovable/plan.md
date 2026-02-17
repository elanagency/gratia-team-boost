
# Fix Stripe Post-Checkout Verification (Layers 1 & 2)

## Problem
After completing Stripe checkout, users return to `/dashboard/settings?tab=billing` with `setup=success&session_id=...` in the URL. But the `usePaymentVerification` hook lives inside `TeamManagementCard` (the Team tab), which is not mounted when the Billing tab is active. The verification never fires, so the subscription is never recorded in the database.

## Layer 1: Move Verification to Settings Page Level

Move `usePaymentVerification` from `TeamManagementCard.tsx` up to `Settings.tsx` so it runs regardless of which tab is active.

**`src/pages/admin/Settings.tsx`**
- Import and call `usePaymentVerification()` at the top of the component

**`src/components/settings/TeamManagementCard.tsx`**
- Remove the `usePaymentVerification` import and usage
- Remove the `isVerifying` state from the loading condition

## Layer 2: Interstitial Success Page

Instead of returning directly to the Settings page (where timing issues can still occur), redirect Stripe through a dedicated success page that handles verification in a clean, isolated component.

**New file: `src/pages/admin/SubscriptionSuccess.tsx`**
- Reads `session_id` from URL params
- Shows a centered card: "Setting up your subscription..." with a spinner
- Calls `verify-stripe-session` on mount
- On success: shows "Subscription activated!" then redirects to `/dashboard/settings?tab=billing` after 2 seconds
- On error: shows error message with a manual "Go to Settings" button

**`src/App.tsx`**
- Add route: `/dashboard/subscription-success` rendering `SubscriptionSuccess`

**`supabase/functions/billing-setup-checkout/index.ts`**
- Change `success_url` from `/dashboard/settings?tab=billing&setup=success&session_id={CHECKOUT_SESSION_ID}` to `/dashboard/subscription-success?session_id={CHECKOUT_SESSION_ID}`
- Change `cancel_url` to `/dashboard/settings?tab=billing`

**`src/hooks/usePaymentVerification.ts`**
- Update the `replaceState` URL (line 52) to remove the `setup` and `session_id` params cleanly (minor cleanup since the interstitial handles the primary flow now; the hook in Settings acts as a fallback for any old URLs)

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/admin/Settings.tsx` | Add `usePaymentVerification` call |
| `src/components/settings/TeamManagementCard.tsx` | Remove `usePaymentVerification` |
| `src/pages/admin/SubscriptionSuccess.tsx` | New interstitial success page |
| `src/App.tsx` | Add `/dashboard/subscription-success` route |
| `supabase/functions/billing-setup-checkout/index.ts` | Update `success_url` to point to interstitial |
