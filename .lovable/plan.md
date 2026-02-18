

# Remove Custom Coupon Field from BillingSetupDialog

## Overview

Remove the custom coupon input from the dialog and rely entirely on Stripe's built-in promotion code field on the checkout page. This simplifies the UI and avoids the issues we encountered with passing coupon codes via the API.

## Changes

### 1. Frontend: `src/components/team/BillingSetupDialog.tsx`

- Remove the `couponCode` state variable and `useState` import for it
- Remove the purple "Have a Coupon?" section with the Input field
- Remove the `couponCode` from the `body` sent to the edge function
- Remove the `invalid_coupon` error check (no longer needed)
- Remove unused imports: `Sparkles`, `Input`

### 2. Edge Function: `supabase/functions/billing-setup-checkout/index.ts`

- Remove `couponCode` from the destructured request body
- Simplify checkout config: always use `allow_promotion_codes: true` (no more conditional `discounts` vs `allow_promotion_codes` logic)
- Remove the `invalid_coupon` error detection in the catch block (no longer needed)
- Clean up related log lines referencing `couponCode`

## Result

Users will see the coupon/promotion code field directly on Stripe's hosted checkout page, which handles all validation natively.

