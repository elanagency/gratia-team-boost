

# Fix Testbed Catalog Sync - Giftbit Sandbox Limitation

## Problem Summary

When syncing Australia brands on the **Test Catalog**, the sync shows "No brands found" because:

1. **Giftbit's testbed environment is a sandbox with very limited brand availability** - it does NOT have the same 108 brands that production has
2. The 15 brands currently showing in testbed were synced **before** our region filter fix - they're actually global/random brands incorrectly labeled as Australian (notice "IKEA de", "Boots GB", "Auchan FR" are all non-Australian brands)

The testbed API is correctly returning 0 brands for region-filtered requests because it simply doesn't have region-specific catalogs like production does.

## Solution

### Step 1: Clean up incorrect testbed data

Delete the incorrectly tagged brands that were synced before our fix:

```sql
DELETE FROM giftbit_brands WHERE environment = 'testbed';
```

### Step 2: Improve error messaging in edge function

Update the edge function to provide clearer feedback when a region returns 0 brands, especially for testbed:

```typescript
// In SYNC_BRANDS action, after fetching all brands
if (allBrands.length === 0) {
  console.log(`No brands available for region ${region} in ${environment} environment`);
  
  // For testbed, this is expected - the sandbox has limited availability
  if (environment === 'testbed') {
    console.log('Note: Giftbit testbed has limited brand availability compared to production');
  }
}
```

### Step 3: Add UI warning for testbed catalog

Show an info message in the Test Catalog UI explaining that the testbed has limited brand availability:

```
ℹ️ The Giftbit Test environment (testbed) has limited brand availability. 
   For full catalog testing, use the Production Catalog tab.
```

---

## Technical Changes

| File | Change |
|------|--------|
| Database (migration) | Clean up incorrect testbed brands |
| `supabase/functions/giftbit-brand-service/index.ts` | Add informative logging for empty region results |
| `src/components/platform/GiftbitBrandCard.tsx` (or equivalent UI) | Add info banner for testbed limitations |

---

## Expected Behavior After Fix

| Environment | Behavior |
|-------------|----------|
| **Production** | Syncs all 108+ brands for AU correctly (already working) |
| **Testbed** | Shows info message explaining limited sandbox availability |
| **Stats** | Testbed shows accurate 0 brands (not incorrect 15) |

---

## Why This Happens

Giftbit's testbed API is a **sandbox environment** meant for:
- Testing API integration
- Validating redemption flows
- Development purposes

It intentionally has a very limited catalog to reduce complexity. The full brand catalogs are only available in the **production API**.

---

## Recommendation

For testing the reward shop UI and redemption flow, you have two options:

1. **Use production catalog for real testing** - This gives you the full 108+ brands to work with
2. **Manually add a few test brands to testbed** - If you need specific test data

The testbed is really only useful for testing API connectivity and redemption flows, not for catalog browsing.

