

# Save and Use Giftbit Region Icons

## Findings

### 1. Brand Count Per Region (15) - This is expected
The Giftbit **testbed API** genuinely only returns 15 brands per region. This is a limitation of their sandbox environment, not our code. The production API will have the full catalog of gift card brands.

Evidence from edge function logs:
```
Syncing 15 brands for region US
Syncing 15 brands for region AU
Syncing 15 brands for region GLBL
```

### 2. Region Icon/Flag Not Being Saved - Bug
The Giftbit API returns an `image_url` for each region (e.g., flag images like `.../flags/CA@3x.png`), but we're:
1. Only using this URL to extract the region code (line 68-73)
2. Not storing the actual image URL in the database

Current database schema for `giftbit_regions`:
| Column | Type |
|--------|------|
| id | uuid |
| region_code | text |
| name | text |
| currency_code | text |
| environment | text |
| is_active | boolean |
| created_at | timestamp |

**Missing:** `image_url` column

---

## Solution

### Phase 1: Database Migration
Add `image_url` column to the `giftbit_regions` table:

```sql
ALTER TABLE giftbit_regions 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Phase 2: Update Edge Function
Modify the `SYNC_REGIONS` case to save the image_url:

```typescript
// Line 266-272 change:
const { error } = await supabase
  .from('giftbit_regions')
  .upsert({
    region_code: regionCode,
    name: apiRegion.name,
    image_url: apiRegion.image_url,  // ADD THIS LINE
    currency_code: currencyCode,
    environment,
    is_active: true
  }, { onConflict: 'region_code,environment' });
```

### Phase 3: Update Frontend Components
Update `getRegionFlag()` and region display components to use the stored image URL when available, falling back to emoji flags:

**Option A - Image-based flags:**
```tsx
// If image_url exists, show actual flag image
{region.image_url ? (
  <img src={region.image_url} alt={region.name} className="w-4 h-4" />
) : (
  <span>{getRegionFlag(region.region_code)}</span>
)}
```

**Option B - Keep emoji flags (simpler)**
Keep using emoji flags for consistency and faster load times, but store the image_url for future use.

---

## Files to Modify

| File | Changes |
|------|---------|
| Database | Add `image_url` column to `giftbit_regions` |
| `supabase/functions/giftbit-brand-service/index.ts` | Save `apiRegion.image_url` in SYNC_REGIONS |
| `src/hooks/useAvailableRegions.ts` | Include `image_url` in query results |
| `src/lib/regionConstants.ts` | Add helper to get region image or fallback to emoji |

---

## Summary

| Issue | Status | Explanation |
|-------|--------|-------------|
| Only 15 brands per region | Expected | Giftbit testbed/sandbox limitation. Production will have full catalog. |
| Region icons not saved | Bug | Will fix by adding `image_url` column and updating sync logic |

