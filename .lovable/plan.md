

# Fix Brand Sync: Unique Constraint + Currency Mapping

## Problem Summary

1. **Missing brands:** 45 brands synced but only 15 visible because the unique constraint `(brand_code, environment)` doesn't include `region_code`, causing regions to overwrite each other
2. **Wrong currency:** All brands show AUD because the API returns empty `currency_code` and both the database default and code fallback use AUD

---

## Root Cause Analysis

### Issue 1: Brand Overwriting

The Giftbit API returns the **same brand_codes across different regions**:
- AU region: `amazonus`, `ikeade`, `bootsgb`... (15 brands)
- GLBL region: `amazonus`, `ikeade`, `bootsgb`... (15 brands)  
- US region: `amazonus`, `ikeade`, `bootsgb`... (15 brands)

Current unique constraint: `(brand_code, environment)`
- When US syncs after AU and GLBL, it overwrites the previous entries
- Result: Only 15 unique brands remain, all with `region_code: US`

### Issue 2: Currency Hardcoded to AUD

Edge function line 326:
```typescript
currency_code: brand.currency_code || 'AUD'  // Fallback to AUD!
```

The Giftbit testbed API returns `null`/`undefined` for `currency_code`, triggering the fallback.

---

## Solution

### 1. Database Migration: Update Unique Constraint

Change unique constraint from `(brand_code, environment)` to `(brand_code, region_code, environment)`:

```sql
-- Drop existing constraint
ALTER TABLE giftbit_brands 
DROP CONSTRAINT IF EXISTS giftbit_brands_brand_code_environment_key;

-- Add new constraint including region_code
ALTER TABLE giftbit_brands 
ADD CONSTRAINT giftbit_brands_brand_code_region_environment_key 
UNIQUE (brand_code, region_code, environment);
```

This allows the same brand (e.g., `amazonus`) to exist separately for AU, US, and GLBL regions.

### 2. Edge Function: Fix Currency Derivation

Update `SYNC_BRANDS` case to use the region's currency instead of AUD fallback:

```typescript
// Line 326 change:
// FROM: currency_code: brand.currency_code || 'AUD',
// TO:
currency_code: brand.currency_code || REGION_CURRENCIES[region] || 'USD',
```

This way:
- AU region brands → AUD
- US region brands → USD
- CA region brands → CAD
- GLBL region brands → USD (fallback)

### 3. Update Upsert Conflict Target

Update the upsert to use the new constraint:

```typescript
// Line 332 change:
// FROM: { onConflict: 'brand_code,environment' }
// TO:
{ onConflict: 'brand_code,region_code,environment' }
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/giftbit-brand-service/index.ts` | Fix currency fallback, update upsert conflict target |

## Database Migration Required

```sql
-- 1. Drop old unique constraint
ALTER TABLE giftbit_brands 
DROP CONSTRAINT IF EXISTS giftbit_brands_brand_code_environment_key;

-- 2. Add new unique constraint with region_code
ALTER TABLE giftbit_brands 
ADD CONSTRAINT giftbit_brands_brand_code_region_environment_key 
UNIQUE (brand_code, region_code, environment);

-- 3. Clear existing incorrectly-synced data to resync
DELETE FROM giftbit_brands WHERE environment = 'testbed';
```

---

## Expected Result After Fix

After re-syncing 3 regions (AU, GLBL, US):
- **45 brands stored** (15 per region, each as separate row)
- AU brands → currency: AUD, region_code: AU
- US brands → currency: USD, region_code: US
- GLBL brands → currency: USD, region_code: GLBL

Catalog will show all 45 brands with correct regional currency badges.

