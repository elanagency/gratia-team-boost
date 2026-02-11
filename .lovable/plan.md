

# Phase 2: Buy Points via Stripe Checkout

## Overview

Add a "Buy Points" flow so company admins can top up their company wallet by purchasing celebration points through Stripe Checkout. Each purchase creates a trackable Stripe product/line item.

## How It Works

1. Admin clicks "Buy Points" on the Celebrations settings tab
2. A dialog opens where they enter how many points they want (e.g. 500)
3. The cost is shown in real-time (500 pts x $0.05 = $25.00)
4. They click "Proceed to Checkout" which redirects to Stripe Checkout
5. After payment, they return to Settings and the company's `points_balance` is credited

## Stripe Product Strategy

A dedicated Stripe product called **"Celebration Points"** will be created (one per environment, stored in `platform_settings` alongside existing product IDs). Each checkout dynamically creates a price based on the current `point_exchange_rate` and the quantity requested -- this way each purchase is a clean line item in the Stripe dashboard showing "Celebration Points x 500".

## Changes Required

### 1. Database Migration

Add two new columns to `platform_settings`:
- `stripe_celebration_product_id_live` (text)
- `stripe_celebration_product_id_test` (text)

These store the Stripe product ID for "Celebration Points" in each environment.

### 2. New Edge Function: `purchase-company-points/index.ts`

Accepts: `companyId`, `pointsQuantity`, `origin`

Flow:
1. Authenticate the user, verify they are admin of the company
2. Get the company's Stripe environment (live/test) and customer ID (create if needed, same pattern as `billing-setup-checkout`)
3. Get `point_exchange_rate` from `platform_settings` to calculate price per point in cents
4. Get or create the "Celebration Points" Stripe product (store ID back to `platform_settings`)
5. Create a Stripe price for the exact unit amount (exchange rate in cents)
6. Create a Stripe Checkout session in `payment` mode with `quantity = pointsQuantity`
7. Metadata includes `company_id`, `points_quantity`, and `purchase_type: "celebration_points"`
8. Success URL redirects to `/dashboard/settings?points_purchase=success&session_id={CHECKOUT_SESSION_ID}`

### 3. Update `verify-stripe-session/index.ts`

Add a new code path that checks `session.metadata.purchase_type === "celebration_points"`:
- Verify payment status is "paid"
- Read `points_quantity` from metadata
- Credit `companies.points_balance` by that amount
- Log a `subscription_events` entry with `event_type: "points_purchase"` for audit
- Return success with the points credited

### 4. Update `CelebrationSettingsCard.tsx`

Replace the disabled "Buy Points (Coming Soon)" button with a working flow:
- "Buy Points" button opens a dialog
- Dialog contains: quantity input, real-time cost display (quantity x exchange rate), and "Proceed to Checkout" button
- The button calls `purchase-company-points` and redirects to the Stripe Checkout URL
- After returning from Stripe, a `useEffect` picks up the `points_purchase=success` query param, calls `verify-stripe-session`, shows a toast, and refreshes the wallet balance

### 5. New Component: `BuyPointsDialog.tsx`

A dialog component in `src/components/settings/` containing:
- Number input for points quantity (with min value, e.g. 100)
- Quick-select buttons (e.g. 500, 1000, 2500, 5000)
- Live cost calculation display
- "Proceed to Checkout" button that triggers the edge function
- Loading state while creating checkout session

## File Summary

| File | Action |
|------|--------|
| `supabase/migrations/...` | Add celebration product ID columns to platform_settings |
| `supabase/functions/purchase-company-points/index.ts` | New edge function |
| `supabase/functions/verify-stripe-session/index.ts` | Add celebration points verification path |
| `src/components/settings/BuyPointsDialog.tsx` | New dialog component |
| `src/components/settings/CelebrationSettingsCard.tsx` | Wire up Buy Points button and post-purchase verification |

## What Will NOT Change

- Existing subscription billing flow
- Monthly points allocation
- Peer-to-peer recognition
- Exchange rate or redemption logic

