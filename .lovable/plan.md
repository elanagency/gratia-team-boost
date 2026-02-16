
# Fix: Instant UI Update After Stripe Checkout Return

## Problem
After returning from Stripe, the billing UI takes ~10 seconds to update because:
1. `usePaymentVerification` invalidates React Query caches, but `BillingCard` and `SubscriptionStatusCard` use local state with manual fetch functions -- they don't listen to React Query.
2. These components rely on Supabase realtime subscriptions to detect company changes, which have network latency.
3. `SubscriptionStatusCard` has its own duplicate URL param checking (lines 150-164) with a hardcoded 2-second delay.

## Solution
Use a custom browser event to signal billing components to refetch immediately after verification succeeds.

## Changes

### 1. `src/hooks/usePaymentVerification.ts`
- After successful `verify-stripe-session` response, dispatch a custom `billing-updated` window event
- This signals all billing components to refetch immediately

### 2. `src/components/settings/BillingCard.tsx`
- Add a `useEffect` listener for the `billing-updated` custom event
- On event, call `fetchSubscriptionStatus()` immediately (no debounce)

### 3. `src/components/settings/SubscriptionStatusCard.tsx`
- Remove the duplicate URL param checking logic (lines 150-164) since `usePaymentVerification` already handles this
- Add a `useEffect` listener for the `billing-updated` custom event
- On event, call `fetchSubscriptionStatus()` immediately

### 4. `src/components/settings/TeamManagementCard.tsx`
- No changes needed -- it already uses `usePaymentVerification` which shows "Processing subscription setup..." during verification. Once verification completes faster (from the user's perspective), this will feel instant.

## Technical Detail
The custom event approach is lightweight and avoids converting these components to React Query (which would be a larger refactor). The `billing-updated` event fires right after `verify-stripe-session` confirms the subscription is saved in the database, so the subsequent fetch will return the updated data.

## Files to Edit
- `src/hooks/usePaymentVerification.ts` -- dispatch `billing-updated` event on success
- `src/components/settings/BillingCard.tsx` -- listen for `billing-updated` event
- `src/components/settings/SubscriptionStatusCard.tsx` -- listen for event, remove duplicate URL handling
