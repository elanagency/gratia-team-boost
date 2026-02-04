
# Fix Giftbit Pagination and Complete Brand Catalog Sync

## Problem Summary

You correctly identified that the Giftbit API call has a **pagination limit**. The API returns a **maximum of 20 brands per page by default**, but Australia has **108 brands** available. This explains why:

- **Total Brands shows 0 or 20** instead of 108+
- **Regions shows 0** when no regions have been synced with their complete catalogs
- Team members only see a fraction of available gift cards

## Root Cause Analysis

Looking at the current edge function code (`giftbit-brand-service/index.ts`, line 293):

```typescript
const url = `${apiBase}/brands?region=${region}`;
```

There is **no pagination handling**. The Giftbit API response includes:
```json
{
  "limit": 20,      // ← Default page size
  "offset": 0,      // ← Starting position
  "total_count": 108 // ← Total available brands
}
```

But the code ignores these pagination fields and only processes the first 20 results.

---

## Solution

### Step 1: Update Edge Function to Handle Pagination

Modify `SYNC_BRANDS` action in `giftbit-brand-service/index.ts` to:
1. Make initial API call to get `total_count`
2. Loop through all pages using `offset` parameter
3. Aggregate all brands before inserting into database

**Updated API call logic:**
```typescript
// Fetch ALL brands with pagination
let allBrands: GiftbitBrand[] = [];
let offset = 0;
const limit = 100; // Request more per page for efficiency
let totalCount = 0;

do {
  const url = `${apiBase}/brands?region=${region}&limit=${limit}&offset=${offset}`;
  console.log(`Fetching brands page: offset=${offset}, limit=${limit}`);
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  const data = await response.json();
  const brands = data.brands || [];
  
  allBrands = allBrands.concat(brands);
  totalCount = data.total_count || brands.length;
  offset += limit;
  
} while (offset < totalCount);

console.log(`Fetched all ${allBrands.length} brands (total_count: ${totalCount})`);
```

### Step 2: Update GET_BRANDS Action Similarly

Apply the same pagination logic to `GET_BRANDS` action for consistency.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/giftbit-brand-service/index.ts` | Add pagination loop for `SYNC_BRANDS` and `GET_BRANDS` actions |

---

## Implementation Details

### Before (Current - Only 20 brands):
```typescript
case 'SYNC_BRANDS': {
  const url = `${apiBase}/brands?region=${region}`;
  const response = await fetch(url, {...});
  const data = await response.json();
  const brands = data.brands || [];  // Only first 20!
  // ... process brands
}
```

### After (All brands with pagination):
```typescript
case 'SYNC_BRANDS': {
  // Fetch ALL brands with pagination
  let allBrands: GiftbitBrand[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${apiBase}/brands?region=${region}&limit=${limit}&offset=${offset}`;
    console.log(`Fetching brands: region=${region}, offset=${offset}`);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch brands: ${response.status}`);
    }
    
    const data = await response.json();
    const brands: GiftbitBrand[] = data.brands || [];
    const totalCount = data.total_count || 0;
    
    allBrands = allBrands.concat(brands);
    offset += limit;
    hasMore = offset < totalCount;
    
    console.log(`Page fetched: ${brands.length} brands, total so far: ${allBrands.length}/${totalCount}`);
  }

  console.log(`Syncing ${allBrands.length} total brands for region ${region}`);
  
  // ... upsert allBrands to database
}
```

---

## Expected Results After Fix

| Metric | Before | After |
|--------|--------|-------|
| AU Brands | 20 | 108 |
| US Brands | 20 | All available |
| Total Brands stat | 60 | 300+ |
| Regions with brands | 3 | All synced regions |

---

## Post-Implementation Steps

1. **Deploy** the updated edge function
2. **Re-sync** production brands from Platform Admin:
   - Navigate to Platform Admin > Gift Cards Catalog
   - Select Production Catalog tab
   - Click "Sync Brands" for each region (AU, US, etc.)
3. **Verify** the stats update to show 108+ for Australia
4. **Test** team member gift card shop shows full catalog

---

## Technical Notes

- The Giftbit API supports `limit` values up to 100 per request
- Using `offset` pagination is standard for the Giftbit API
- No database schema changes required
- The `get-rewards-shop` edge function will automatically return more brands since it queries from `giftbit_brands` table
