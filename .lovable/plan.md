

# Billing Model Overhaul: Immediate Subscription on First Invite

## Summary
Replace the current 3-step billing flow (card verify -> wait for login -> create subscription) with a simpler 2-step flow: admin starts a real subscription for 1 seat when they first invite, and seat count updates automatically with proration as members join.

## New Billing Flow

1. **Sign Up** -- Free, no changes
2. **First Invite Click** -- Instead of a "setup" checkout (card verification), open a Stripe Checkout in `subscription` mode for **1 seat** (the admin). Promotion codes enabled. Billing starts immediately.
3. **Team Member Logs In** -- Update the existing subscription quantity (e.g. 2 seats, 3 seats). Stripe prorates automatically from that point.
4. **Ongoing** -- Seats adjust as members are added/removed. Billing cycle stays anchored to the original subscription start date.

## What Changes

### Edge Functions

**1. Modify `billing-setup-checkout` (or replace with subscription checkout)**
- Change mode from `"setup"` to `"subscription"`
- Use the platform `stripe_price_id` with `quantity: 1` (the admin seat)
- Enable `allow_promotion_codes: true`
- On success, the subscription is live immediately -- no waiting

**2. Modify `verify-stripe-session`**
- When processing the new subscription checkout, save `stripe_subscription_id`, `stripe_subscription_item_id`, and `subscription_status` on the company
- Remove the `billing_ready` logic (no longer needed as a separate concept)
- Keep `billing_ready = true` for backward compat but it's now set alongside the subscription

**3. Modify `billing-activate-on-first-login`**
- Instead of creating a new subscription, just **update the existing subscription quantity** (add 1 seat)
- If no subscription exists (edge case), fall back to current behavior
- Remove the `billing_cycle_anchor` to 1st-of-next-month logic -- Stripe anchors to the subscription creation date automatically

**4. Modify `update-subscription`**
- Keep mostly as-is, it already handles quantity updates with `proration_behavior: 'always_invoice'`
- Ensure the admin seat (+1) is always included in the count

### Frontend

**5. Modify `BillingSetupDialog.tsx`**
- Update copy: instead of "Setup Payment Method" explain that this starts a subscription for 1 seat (the admin)
- Update messaging: "Your subscription starts at $X/month for your admin seat. Team members are added to your subscription as they join."
- Mention that coupons can be applied at checkout

**6. Modify `TeamInviteManager.tsx`**
- The `needsBillingSetup` check should now look for whether a subscription exists (`stripe_subscription_id`) rather than `billing_ready`
- If no subscription, show the billing dialog; if subscription exists, go straight to invite

**7. Modify `BillingCard.tsx` and `SubscriptionStatusCard.tsx`**
- Update "How It Works" copy to reflect the new model
- The billing card should always show the admin as a billed seat

**8. Add "Apply Coupon" to Settings (optional, can be Phase 2)**
- Add a field in the Billing settings where existing subscribers can enter a promotion code
- This calls the Stripe API to apply a coupon to the existing subscription

### Database
- No schema changes needed. The `billing_ready` column stays for backward compatibility but is now set alongside subscription creation.

## Files to Edit
- `supabase/functions/billing-setup-checkout/index.ts` -- change to subscription mode
- `supabase/functions/verify-stripe-session/index.ts` -- handle new subscription checkout
- `supabase/functions/billing-activate-on-first-login/index.ts` -- update quantity instead of creating
- `src/components/team/BillingSetupDialog.tsx` -- update copy
- `src/components/team/TeamInviteManager.tsx` -- check for subscription instead of billing_ready
- `src/hooks/useCompanyMembers.ts` -- update teamSlots logic
- `src/components/settings/BillingCard.tsx` -- update copy
- `src/components/settings/SubscriptionStatusCard.tsx` -- update copy

## What Stays the Same
- `create-subscription-checkout` -- still used if needed for direct checkout flows
- `update-subscription` -- still handles quantity changes
- `customer-portal` -- still works for managing billing via Stripe
- Stripe environment routing (live/test) -- unchanged
- Coupon support at checkout -- already built into `create-subscription-checkout` via `allow_promotion_codes: true`

## Risk Considerations
- Existing companies with `billing_ready = true` but no subscription: these are companies who verified their card under the old model. We handle this gracefully by checking for subscription first, billing_ready second.
- The admin is now always seat #1, so the minimum subscription is always 1 seat (even with 0 team members).

