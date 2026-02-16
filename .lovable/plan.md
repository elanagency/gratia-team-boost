

# Option B: Reset Stuck Companies

## What We're Doing
Reset the 7 companies that have `billing_ready = true` but no active Stripe subscription. This clears the old billing flag so they enter the new subscription flow (where billing starts when the admin clicks "Upgrade to Add Your Team" in the onboarding checklist).

## Companies Being Reset

| Company | Current State |
|---------|--------------|
| Test otp | billing_ready=true, no subscription |
| JAV | billing_ready=true, no subscription |
| Dromo | billing_ready=true, no subscription |
| New Test | billing_ready=true, no subscription |
| MAIN 3 | billing_ready=true, no subscription |
| America | billing_ready=true, no subscription |
| Grattia Inc | billing_ready=true, no subscription |

## The Change
A single SQL UPDATE to set `billing_ready = false` for these 7 companies. No code changes needed -- the new billing flow already handles companies without `billing_ready`.

## SQL to Execute
```sql
UPDATE companies
SET billing_ready = false, updated_at = now()
WHERE billing_ready = true
  AND stripe_subscription_id IS NULL;
```

## What Stays Unchanged
The 5 companies with active Stripe subscriptions remain untouched -- they'll continue working normally with the new model.

