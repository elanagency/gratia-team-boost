

# Fix: update-subscription Using Wrong Stripe Environment Key

## Problem

The `update-subscription` edge function determines which Stripe API key (test vs live) by reading from `platform_settings.environment_mode`, which is set to "test". However, the company's subscription was created in Stripe **live** mode (the company record has `environment: 'live'`).

This causes the error:
> "No such subscription: 'sub_1T2ADED5DKeCxXypvc3nk5a1'; a similar object exists in live mode, but a test mode key was used to make this request."

The `billing-setup-checkout` and `billing-activate-on-first-login` functions already correctly use the **company's own `environment` field** to pick the right Stripe key. The `update-subscription` function does not -- it reads a global platform setting instead.

## Fix

### File: `supabase/functions/update-subscription/index.ts`

Update the `getStripeKey` function to accept a `companyId` parameter, look up the company's `environment` field, and use that to select the correct Stripe key -- matching the pattern used by other billing functions.

Specifically:
- Change the function signature to accept the Supabase client and the `companyId`
- Query `companies.environment` for that company (instead of `platform_settings.environment_mode`)
- Use the company's environment to pick `STRIPE_SECRET_KEY_LIVE` or `STRIPE_SECRET_KEY_TEST`
- Default to "live" (not "test") to match the other billing functions
- Also select the `environment` field in the company query on line 71 so it's available

This is a one-file change in the edge function. No frontend changes needed.

