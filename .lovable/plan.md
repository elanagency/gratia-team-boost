

# Fix Giftbit Brand Sync - Region ID Parameter Bug

## Problem Summary

When syncing Australia brands on production, **1337 brands were synced instead of the expected ~108** because the Giftbit API is **ignoring the region filter entirely**.

**Root Cause**: The Giftbit API `/brands` endpoint expects a **numeric region ID** (e.g., `region=4` for Australia), but our code is passing a **string region code** (e.g., `region=AU`). The API ignores invalid parameters and returns **ALL brands globally**.

**Evidence from API documentation**:
```
region (number, optional) - Limits the results to brands that are available 
in the provided region as per the `id` returned from the `/region` endpoint.
```

The `/regions` endpoint returns:
```json
{ "id": 4, "name": "Australia", "image_url": "...flags/AU@3x.png" }
```

So `region=4` is correct, NOT `region=AU`.

---

## Solution

### Step 1: Add `giftbit_region_id` column to database

Add a new column to store the numeric Giftbit API region ID that's needed for filtering brands:

```sql
ALTER TABLE giftbit_regions 
ADD COLUMN giftbit_region_id INTEGER;
```

### Step 2: Update `SYNC_REGIONS` action in edge function

When syncing regions from the Giftbit API, store the numeric `id` field:

```typescript
// In SYNC_REGIONS action
const { error } = await supabase
  .from('giftbit_regions')
  .upsert({
    giftbit_region_id: apiRegion.id,  // ← Add this numeric ID
    region_code: regionCode,
    name: apiRegion.name,
    // ... rest
  });
```

### Step 3: Update `SYNC_BRANDS` action to use numeric ID

Before fetching brands, look up the numeric region ID:

```typescript
case 'SYNC_BRANDS': {
  // Look up the Giftbit region ID from the database
  const { data: regionData } = await supabase
    .from('giftbit_regions')
    .select('giftbit_region_id')
    .eq('region_code', region)
    .eq('environment', environment)
    .single();

  const giftbitRegionId = regionData?.giftbit_region_id;
  if (!giftbitRegionId) {
    throw new Error(`Region ${region} not found. Please sync regions first.`);
  }

  // Use the numeric ID in the API call
  const url = `${apiBase}/brands?region=${giftbitRegionId}&limit=${limit}&offset=${offset}`;
  // ...
}
```

### Step 4: Apply same fix to `GET_BRANDS` action

Same lookup logic for the GET_BRANDS action.

### Step 5: Clean up incorrect data

Delete the incorrectly synced brands that aren't actually Australian:

```sql
DELETE FROM giftbit_brands 
WHERE environment = 'production' 
AND region_code = 'AU';
```

---

## Technical Changes

| File | Change |
|------|--------|
| Database migration | Add `giftbit_region_id INTEGER` column to `giftbit_regions` table |
| `supabase/functions/giftbit-brand-service/index.ts` | Update `SYNC_REGIONS` to store numeric ID |
| `supabase/functions/giftbit-brand-service/index.ts` | Update `SYNC_BRANDS` to look up and use numeric ID |
| `supabase/functions/giftbit-brand-service/index.ts` | Update `GET_BRANDS` to look up and use numeric ID |

---

## Expected Results After Fix

| Metric | Before (Broken) | After (Fixed) |
|--------|-----------------|---------------|
| AU Brands | 1337 (all global) | ~108 (only Australian) |
| Region filter | Ignored | Works correctly |
| Duplicates | Many (Adidas x18) | None |

---

## Post-Implementation Steps

1. Run database migration to add `giftbit_region_id` column
2. Deploy updated edge function
3. Click **"Refresh Regions"** in Platform Admin to populate the new IDs
4. Delete incorrect AU brands from database
5. Click **"Sync 1 Region"** for Australia to get correct brands

