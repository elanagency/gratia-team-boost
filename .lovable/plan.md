

# Fix Brand Syncing - Connect to Giftbit API Instead of Goody

## Root Cause

**The "Sync X Regions" button is calling the wrong API!**

Current flow (broken):
```
Sync 59 Regions button → useSyncGiftCards → goody-product-service → Goody API (empty for you)
```

Required flow:
```
Sync 59 Regions button → useSyncGiftbitBrands → giftbit-brand-service → Giftbit API → giftbit_brands table
```

The `EnvironmentSyncCard` component uses `useSyncGiftCards` hook which calls `goody-product-service` edge function. This is the old Goody API integration, not Giftbit! That's why it returns "no gift cards found" - the Goody catalog is empty.

---

## Solution

Create a new hook `useSyncGiftbitBrands` that calls the `giftbit-brand-service` edge function with `SYNC_BRANDS` action for each selected region.

---

## Implementation Details

### Phase 1: Create New Sync Hook

**New File: `src/hooks/useSyncGiftbitBrands.ts`**

```typescript
export const useSyncGiftbitBrands = (environment: 'test' | 'live') => {
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  
  const syncMutation = useMutation({
    mutationFn: async (selectedRegions: string[]) => {
      let totalSynced = 0;
      let totalErrors = 0;
      
      // Sync brands for each selected region
      for (const region of selectedRegions) {
        const { data, error } = await supabase.functions.invoke('giftbit-brand-service', {
          body: { 
            action: 'SYNC_BRANDS', 
            environment: giftbitEnv,
            region 
          }
        });
        
        if (error || !data?.success) {
          totalErrors++;
        } else {
          totalSynced += data.synced || 0;
        }
      }
      
      return { totalSynced, totalErrors, regionsProcessed: selectedRegions.length };
    },
    onSuccess: (result) => {
      toast.success(`Synced ${result.totalSynced} brands from ${result.regionsProcessed} regions`);
      // Invalidate giftbit-brands queries
    }
  });
  
  return { syncBrands: syncMutation.mutate, ... };
};
```

### Phase 2: Update EnvironmentSyncCard

**File: `src/components/platform/EnvironmentSyncCard.tsx`**

Replace the old hook usage:
```typescript
// OLD (calling Goody API)
const { syncMutation, ... } = useSyncGiftCards(environment);

// NEW (calling Giftbit API)
const { syncBrands, isSyncing, progress } = useSyncGiftbitBrands(environment);

const handleSync = () => {
  syncBrands(selectedRegions); // Pass selected regions to sync
};
```

### Phase 3: Update Sync Status Query

The current sync status checks `goody_gift_cards` table. Update to check `giftbit_brands`:

```typescript
// Query giftbit_brands for last sync time
const { data: syncStatus } = useQuery({
  queryKey: ['giftbit-sync-status', giftbitEnv],
  queryFn: async () => {
    const { data } = await supabase
      .from('giftbit_brands')
      .select('last_synced_at', { count: 'exact' })
      .eq('environment', giftbitEnv)
      .order('last_synced_at', { ascending: false })
      .limit(1);
    
    return { lastSynced: data?.[0]?.last_synced_at };
  }
});
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useSyncGiftbitBrands.ts` | Hook to sync brands via giftbit-brand-service |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/platform/EnvironmentSyncCard.tsx` | Replace useSyncGiftCards with useSyncGiftbitBrands |

---

## API Flow After Fix

```text
User clicks "Sync 59 Regions"
        ↓
useSyncGiftbitBrands.syncBrands(['AU', 'US', 'CA', ...])
        ↓
For each region:
  supabase.functions.invoke('giftbit-brand-service', {
    body: { action: 'SYNC_BRANDS', environment: 'testbed', region: 'AU' }
  })
        ↓
Edge function fetches: GET /papi/v1/brands?region=AU
        ↓
Upserts brands into giftbit_brands table
        ↓
Returns { success: true, synced: 15 }
        ↓
Repeat for next region...
        ↓
Toast: "Synced 450 brands from 59 regions"
        ↓
Invalidate giftbit-brands query
        ↓
Catalog displays synced brands
```

---

## Expected Result

After this fix:
1. "Sync 59 Regions" will call Giftbit API (not Goody)
2. Brands will be fetched for each selected region
3. `giftbit_brands` table will be populated
4. Catalog will display the synced brands
5. Progress indicator shows which region is being synced

