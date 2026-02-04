

# Fix Giftbit Redemption API Call

## Problem Identified

The Giftbit `/direct_links` API is returning a 422 error because we're using the wrong parameter name:

**Error message:**
```
Invalid request parameters: Property [region]: One (and only one) of 
either region or brand_codes must be provided
```

The API documentation clearly states:
> Required parameters for the API include `price_in_cents` and `brand_codes` (or `region` for Full Catalog rewards).

## Root Cause

In `supabase/functions/giftbit-redemption-service/index.ts`, line 117:

```typescript
// Current (WRONG)
const giftbitPayload = {
  brand_code: brandCode,  // ← Singular, not recognized by API
  price_in_cents: Math.round(dollarAmount * 100),
  id: idempotencyKey,
  expiry: expiry
};
```

## The Fix

Change `brand_code` to `brand_codes` as an array:

```typescript
// Fixed (CORRECT)
const giftbitPayload = {
  brand_codes: [brandCode],  // ← Array format as required by API
  price_in_cents: Math.round(dollarAmount * 100),
  id: idempotencyKey,
  expiry: expiry
};
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/giftbit-redemption-service/index.ts` | Change `brand_code: brandCode` to `brand_codes: [brandCode]` |

## What's Already Set Up (No Changes Needed)

| Component | Status |
|-----------|--------|
| `GIFTBIT_API_KEY_TESTBED` secret | Configured |
| `giftbit_brands` table | 15 Australian brands synced |
| `giftbit_regions` table | AU region exists |
| `redemptions` table with Giftbit columns | Ready |
| Frontend modal and hooks | Working correctly |
| `get-rewards-shop` edge function | Returning Giftbit brands |

## After the Fix

1. Deploy the updated edge function
2. Retry the redemption with "Auchan" or any other brand
3. The claim link should be returned immediately
4. Points will be deducted and success dialog will appear

---

## Technical Details

### Giftbit Direct Links API Requirements

According to the official documentation:

| Parameter | Type | Required |
|-----------|------|----------|
| `brand_codes` | array of strings | Yes (OR use `region`) |
| `price_in_cents` | integer | Yes |
| `id` | string | Yes (idempotency key) |
| `expiry` | string (YYYY-MM-DD) | Optional |

### Example Valid Payload

```json
{
  "brand_codes": ["auchanfr"],
  "price_in_cents": 1500,
  "id": "redemption-unique-id-12345",
  "expiry": "2027-02-04"
}
```

### Expected Response

```json
{
  "direct_links": [{
    "status": "ACTIVE",
    "link_url": "https://testbed.giftbit.com/claim/...",
    "uuid": "gift-uuid-here"
  }]
}
```

