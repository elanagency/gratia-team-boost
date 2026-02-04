
# Add Sync Regions Button to Platform Admin Gift Cards Page

## Overview

This plan adds a "Sync Regions" button to the Platform Admin Gift Cards page that fetches all available regions from the Giftbit API and populates the `giftbit_regions` table. This will make all regions (AU, US, CA, GB, NZ, etc.) available for selection when assigning regions to companies.

## Root Cause Analysis

The `giftbit_regions` table only contains AU for testbed because the `SYNC_REGIONS` action in `giftbit-brand-service` has never been executed for either environment. The edge function already supports this action - we just need UI to trigger it.

## Implementation Plan

### Phase 1: Add Sync Regions Hook

Create a new hook to handle the region sync operation.

**New File: `src/hooks/useSyncRegions.ts`**

```typescript
// Hook that calls giftbit-brand-service with SYNC_REGIONS action
// - Accepts environment parameter (test/live)
// - Maps test -> testbed, live -> production for API call
// - Returns mutation for syncing regions
// - Invalidates useAvailableRegions query on success
```

### Phase 2: Update EnvironmentSyncCard UI

Add a "Sync Regions" button next to the existing sync controls.

**Modify: `src/components/platform/EnvironmentSyncCard.tsx`**

Changes:
- Import the new `useSyncRegions` hook
- Add a "Sync Regions" button in the action buttons section
- Show a subtle indicator if regions haven't been synced yet (count is 0 or only AU exists)
- Display success/error toast messages

**Updated Button Section:**
```text
┌─────────────────────────────────────────────────────────────┐
│ [Sync X Regions]  [Sync Regions]  [Test API]                │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Visual Feedback

Add visual cues to indicate when regions need syncing.

**UI Indicators:**
- If only 1 region exists (AU fallback): Show "Regions not synced" badge
- Button shows loading spinner during sync
- Success toast shows count of regions synced
- Error toast with specific error message

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useSyncRegions.ts` | Hook to sync regions from Giftbit API |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/platform/EnvironmentSyncCard.tsx` | Add Sync Regions button |

### API Call Flow

```text
User clicks "Sync Regions"
        ↓
useSyncRegions mutation fires
        ↓
supabase.functions.invoke('giftbit-brand-service', {
  body: { action: 'SYNC_REGIONS', environment: 'testbed' | 'production' }
})
        ↓
Edge function fetches /regions from Giftbit API
        ↓
Edge function upserts into giftbit_regions table
        ↓
Returns { success: true, synced: N }
        ↓
Invalidate 'available-regions' query
        ↓
UI updates with all regions now available
```

### Environment Mapping

| UI Environment | API Environment |
|----------------|-----------------|
| test | testbed |
| live | production |

---

## Implementation Sequence

1. **Create `useSyncRegions.ts` hook** - Mutation to call SYNC_REGIONS action
2. **Update `EnvironmentSyncCard.tsx`** - Add Sync Regions button with proper state handling
3. **Test the flow** - Verify regions appear after sync

---

## Expected Outcome

After clicking "Sync Regions":
- All Giftbit regions (AU, US, CA, GB, NZ, etc.) will appear in the dropdown
- Platform admins can assign any synced region to companies
- The checkbox list will show all available regions instead of just AU
