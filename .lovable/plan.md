
# Fix: Show "Invalid Coupon" Error Message

## Overview

When a user enters an invalid coupon code, Stripe throws an error that currently gets caught by the generic error handler, showing "Failed to setup billing." Instead, we should detect coupon-specific errors and show a clear message like "This coupon code is not valid."

## Changes

### 1. Edge Function: `supabase/functions/billing-setup-checkout/index.ts`

In the catch block (line 222+), detect Stripe coupon errors by checking for the `resource_missing` error code or coupon-related messages, and return a structured error with a specific `errorType`:

```typescript
} catch (error) {
  console.error("[BILLING-SETUP-CHECKOUT] Error:", error);
  
  // Detect invalid coupon errors from Stripe
  const stripeError = error as any;
  if (stripeError?.type === 'StripeInvalidRequestError' && 
      (stripeError?.message?.includes('coupon') || stripeError?.message?.includes('No such coupon'))) {
    return new Response(
      JSON.stringify({ 
        error: "Invalid coupon code",
        errorType: "invalid_coupon"
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // ... keep existing generic error handling
}
```

### 2. Frontend: `src/components/team/BillingSetupDialog.tsx`

After the `supabase.functions.invoke` call, check for the `invalid_coupon` error type in the response data and show a specific toast:

```typescript
if (error) {
  // ... existing auth error checks
  throw error;
}

// Check for coupon validation error (returned as 400 with data)
if (data?.errorType === 'invalid_coupon') {
  toast.error("This coupon code is not valid. Please check and try again.");
  setIsSettingUp(false);
  return;
}
```

Note: Supabase's `functions.invoke` returns non-2xx responses in `data` (not `error`) when the response body is valid JSON, so we check `data.errorType`.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/billing-setup-checkout/index.ts` | Detect Stripe coupon errors and return `errorType: "invalid_coupon"` |
| `src/components/team/BillingSetupDialog.tsx` | Check for `invalid_coupon` error type and show specific toast message |
