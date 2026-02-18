

# Feature: Company-Entered Coupon in Billing Setup Dialog

## Overview

The company admin can paste a Stripe Coupon ID directly into the pre-checkout popup (BillingSetupDialog). The coupon is then attached to the subscription object itself, so Stripe automatically applies it to all invoices — including immediate proration invoices when new seats are added.

No database changes needed. No platform settings changes. Just a UI input field and passing the value through to the edge function.

## User Flow

1. Company admin signs up, navigates to upgrade their plan
2. The BillingSetupDialog popup appears explaining how billing works
3. In the "Have a Coupon?" section, there is now an input field where they can paste a coupon code
4. They click "Start Subscription" — the coupon is sent to the edge function
5. The edge function attaches the coupon to the subscription via `subscription_data.coupon`
6. Stripe checkout opens (without the manual promo code field, since the coupon is already applied)
7. All future invoices on this subscription (including seat addition prorations) respect the coupon's rules

If the admin leaves the coupon field empty, the checkout falls back to `allow_promotion_codes: true` so they can still manually enter a code on the Stripe checkout page.

## Changes

### 1. `src/components/team/BillingSetupDialog.tsx`

- Add a `couponCode` state variable
- Replace the static "Have a Coupon?" text (lines 121-129) with an input field where the admin can paste a coupon code
- Pass `couponCode` in the request body to the edge function (line 49-57)

The "Have a Coupon?" section becomes:

```
Have a Coupon?
[ Enter coupon code          ]
The coupon will be applied to your subscription
and all future charges.
```

### 2. `supabase/functions/billing-setup-checkout/index.ts`

- Extract `couponCode` from the request body (line 47)
- If a coupon code is provided:
  - Add `coupon: couponCode` to the `subscription_data` object (line 187-192)
  - Remove `allow_promotion_codes: true` from the checkout config
- If no coupon code is provided:
  - Keep `allow_promotion_codes: true` so they can enter one on the Stripe page

The key change in the checkout config (around line 174):

```typescript
const checkoutConfig: any = {
  customer: customerId,
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  // Only allow manual promo codes if no coupon was pre-entered
  ...(couponCode ? {} : { allow_promotion_codes: true }),
  metadata: { ... },
  subscription_data: {
    metadata: { company_id: companyId, environment: company.environment || 'live' },
    // Attach coupon to the subscription itself
    ...(couponCode ? { coupon: couponCode } : {}),
  },
  success_url: ...,
  cancel_url: ...,
};
```

## Why This Works

When a coupon is attached to the Stripe subscription object (not just the checkout session), Stripe automatically applies it to every invoice that subscription generates. This includes:
- The initial checkout invoice
- Immediate proration invoices from `always_invoice` when seats are added
- Monthly renewal invoices

The coupon's own rules (duration, percentage, fixed amount, etc.) control exactly how long it lasts — all managed in the Stripe Dashboard.

## Files Modified

| File | Change |
|------|--------|
| `src/components/team/BillingSetupDialog.tsx` | Add coupon input field to the "Have a Coupon?" section, pass value to edge function |
| `supabase/functions/billing-setup-checkout/index.ts` | Accept `couponCode` param, attach to `subscription_data.coupon` when present |

## No Database Changes Required

The coupon code is entered by the user at checkout time and passed directly to Stripe. Nothing needs to be stored in the database.

