

# Fix: Stripe Coupon Parameter Error

## The Problem

The Stripe Checkout Session API does not accept `coupon` inside `subscription_data`. The error from Stripe is:

> Received unknown parameter: subscription_data[coupon]

## The Fix

Use Stripe's top-level `discounts` parameter instead. When you pass `discounts: [{ coupon: 'COUPON_ID' }]` to a Checkout Session in subscription mode, Stripe automatically attaches the coupon to the subscription object -- so it still applies to all future invoices including proration invoices from seat additions.

**Important**: `discounts` and `allow_promotion_codes` are mutually exclusive in the Stripe API, which aligns with our existing logic.

### File: `supabase/functions/billing-setup-checkout/index.ts`

Move the coupon from `subscription_data.coupon` to a top-level `discounts` array:

```typescript
const checkoutConfig: any = {
  customer: customerId,
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  // discounts and allow_promotion_codes are mutually exclusive
  ...(couponCode ? { discounts: [{ coupon: couponCode }] } : { allow_promotion_codes: true }),
  metadata: { ... },
  subscription_data: {
    metadata: {
      company_id: companyId,
      environment: company.environment || 'live',
    },
    // coupon removed from here
  },
  success_url: ...,
  cancel_url: ...,
};
```

That's the only change -- one line moves from inside `subscription_data` to a top-level `discounts` array.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/billing-setup-checkout/index.ts` | Replace `subscription_data.coupon` with top-level `discounts` parameter |

