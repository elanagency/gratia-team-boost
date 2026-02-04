
# Fix Gift Cards Catalog - Complete Giftbit Integration

## Problem Analysis

Based on the Giftbit API documentation screenshot you provided, the API returns regions with this structure:

```json
{
  "regions": [
    { "id": 1, "name": "Canada", "image_url": ".../flags/CA@3x.png" },
    { "id": 2, "name": "USA", "image_url": ".../flags/US@3x.png" },
    { "id": 3, "name": "Global", "image_url": ".../flags/GLBL@3x.png" },
    { "id": 4, "name": "Australia", "image_url": ".../flags/AU@3x.png" }
  ]
}
```

But the edge function expects `region.region_code` and `region.currency_code` which **don't exist** in the API response. That's why all 63 regions fail to sync with a null constraint error.

Additionally, the catalog page still uses `useGoodyProducts` (the old Goody API) instead of displaying Giftbit brands.

---

## Solution Overview

### 1. Fix Region Sync in Edge Function

Update `giftbit-brand-service` to:
- Extract region code from the `image_url` filename (e.g., `CA@3x.png` → `CA`)
- Map region names to currency codes using a static lookup table
- Handle edge cases like "Global" → `GLBL` and "USA" → `US`

### 2. Switch Catalog to Giftbit Data

Replace the Goody-based display with Giftbit brands from the `giftbit_brands` table.

---

## Technical Implementation

### Phase 1: Fix Edge Function Field Mapping

**File: `supabase/functions/giftbit-brand-service/index.ts`**

Add a helper function to extract region code from image URL:
```typescript
function extractRegionCode(imageUrl: string, name: string): string {
  // Extract from image URL like ".../flags/CA@3x.png" → "CA"
  const match = imageUrl.match(/flags\/([A-Z]+)@/);
  if (match) return match[1];
  
  // Fallback: derive from name
  const nameMap: Record<string, string> = {
    'Canada': 'CA',
    'USA': 'US',
    'Australia': 'AU',
    'Global': 'GLBL',
    'United Kingdom': 'GB',
    'New Zealand': 'NZ'
  };
  return nameMap[name] || name.substring(0, 2).toUpperCase();
}
```

Add currency mapping:
```typescript
const REGION_CURRENCIES: Record<string, string> = {
  'CA': 'CAD',
  'US': 'USD',
  'AU': 'AUD',
  'GB': 'GBP',
  'NZ': 'NZD',
  'GLBL': 'USD' // Global defaults to USD
};
```

Update SYNC_REGIONS case to use actual API response fields:
```typescript
case 'SYNC_REGIONS': {
  const data = await response.json();
  // API returns: { id, name, image_url }
  for (const region of data.regions) {
    const regionCode = extractRegionCode(region.image_url, region.name);
    const currencyCode = REGION_CURRENCIES[regionCode] || 'USD';
    
    await supabase.from('giftbit_regions').upsert({
      region_code: regionCode,
      name: region.name,
      currency_code: currencyCode,
      environment,
      is_active: true
    }, { onConflict: 'region_code,environment' });
  }
}
```

### Phase 2: Create Giftbit Brands Hook

**New File: `src/hooks/useGiftbitBrands.ts`**

Query `giftbit_brands` table directly:
```typescript
export interface GiftbitBrand {
  id: string;
  brand_code: string;
  name: string;
  description: string;
  image_url: string;
  min_price_in_cents: number;
  max_price_in_cents: number;
  region_code: string;
  currency_code: string;
  is_active: boolean;
}

export const useGiftbitBrands = (environment: 'test' | 'live') => {
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  
  return useQuery({
    queryKey: ['giftbit-brands', giftbitEnv],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('giftbit_brands')
        .select('*')
        .eq('environment', giftbitEnv)
        .eq('is_active', true)
        .order('name');
      
      return data || [];
    }
  });
};
```

### Phase 3: Create Giftbit Brand Card Component

**New File: `src/components/platform/GiftbitBrandCard.tsx`**

Display Giftbit brand data:
- Brand image
- Brand name and description
- Price range (min/max in cents → formatted currency)
- Region badge with flag emoji
- Currency indicator
- Enable/disable toggle for platform blacklist

### Phase 4: Update Catalog Page

**File: `src/pages/platform/PlatformGiftCardsCatalog.tsx`**

Replace Goody with Giftbit:
- Import `useGiftbitBrands` instead of `useGoodyProducts`
- Import `GiftbitBrandCard` instead of `GoodyProductCard`
- Update statistics to count Giftbit brands
- Add region filter dropdown
- Update empty state messages

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useGiftbitBrands.ts` | Fetch brands from giftbit_brands table |
| `src/components/platform/GiftbitBrandCard.tsx` | Display individual Giftbit brand card |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/giftbit-brand-service/index.ts` | Fix region field mapping, add currency lookup |
| `src/pages/platform/PlatformGiftCardsCatalog.tsx` | Switch from Goody to Giftbit data source |

---

## Expected Outcome

After implementation:
1. **Sync Regions** will correctly populate `giftbit_regions` with all regions (CA, US, AU, GLBL, etc.)
2. **Sync Brands** will populate `giftbit_brands` with brands for each synced region
3. Catalog page will display Giftbit brands with:
   - Brand image and name
   - Price range
   - Region badge (🇨🇦 CA, 🇺🇸 US, 🌐 Global, etc.)
   - Currency indicator
4. Platform admins can filter by region and enable/disable specific brands
