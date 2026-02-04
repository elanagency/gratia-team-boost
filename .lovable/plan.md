
# Multi-Region Company Support with Region Tags

## Overview

This plan implements a system where companies can have multiple regions assigned to them, and when team members browse the gift card shop, they see region tags on each brand indicating where it's available.

## Current State Analysis

### What Exists Today
- **`giftbit_brands` table**: Has `region_code` and `currency_code` columns for each brand
- **`giftbit_regions` table**: Contains region definitions (currently only AU synced)
- **`companies` table**: Has `environment` column but no region configuration
- **`get-rewards-shop` edge function**: Auto-detects region from HTTP headers with AU fallback
- **`giftbit-brand-service`**: Can sync brands and regions via `SYNC_REGIONS` and `SYNC_BRANDS` actions
- **Shop UI**: `SimpleGiftCardItem` shows brand image and name, no region indicator

### The Problem
- Companies can't have multiple regions assigned
- No region tags visible when browsing gift cards
- Platform admins can't assign regions to companies
- Company admins can't see their assigned regions
- Only AU brands are currently synced

---

## Implementation Plan

### Phase 1: Database Schema - Company Regions Junction Table

Create a junction table to link companies with their enabled regions (many-to-many relationship).

**SQL Migration:**
```sql
-- Create junction table for company regions
CREATE TABLE company_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  region_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, region_code)
);

-- Enable RLS
ALTER TABLE company_regions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Platform admins can manage all company regions"
  ON company_regions FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "Company admins can view their regions"
  ON company_regions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Company members can view their regions"
  ON company_regions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() AND status = 'active'
  ));

-- Index for performance
CREATE INDEX idx_company_regions_company_id ON company_regions(company_id);
CREATE INDEX idx_company_regions_region_code ON company_regions(region_code);
```

---

### Phase 2: Update Edge Function - Filter by Company Regions

Modify `get-rewards-shop` to return brands from all company-assigned regions, including the region code with each brand.

**Current Flow:**
```text
Request Headers --> Auto-Detect Region --> Query Single Region --> Return Cards
```

**New Flow:**
```text
User Auth --> Get Company's Assigned Regions --> Query All Matching Brands --> Return Cards with Region Tags
```

**Changes to `supabase/functions/get-rewards-shop/index.ts`:**

1. Query `company_regions` table to get all assigned regions for the user's company
2. If no regions assigned, fall back to AU (default)
3. Query `giftbit_brands` filtering by `region_code IN (assigned regions)`
4. Include `region_code` in the returned GiftCard objects
5. Return available regions in the response for UI reference

**Updated Response Structure:**
```typescript
{
  success: true,
  data: {
    giftCards: [...], // Each card includes region_code
    exchangeRate: 0.05,
    userContext: {
      companyId: "...",
      environment: "live",
      assignedRegions: ["AU", "US", "GLOBAL"], // Company's assigned regions
      provider: "giftbit"
    }
  }
}
```

---

### Phase 3: Update GiftCard Interface

Add `region_code` to the GiftCard type used throughout the frontend.

**Changes to `src/hooks/useRewardsShop.ts`:**
```typescript
export interface GiftCard {
  // ... existing fields
  region_code?: string; // NEW: ISO country code or "GLOBAL"
}
```

---

### Phase 4: Region Tag Component

Create a reusable component to display region badges with flag emojis.

**New File: `src/components/team/RegionBadge.tsx`**

```text
┌─────────────────────────────────┐
│ 🇦🇺 AU                          │  <- Single region badge
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🌐 Global                       │  <- Global brand badge
└─────────────────────────────────┘
```

**Region to Flag Mapping:**
| Code | Flag | Display |
|------|------|---------|
| AU | 🇦🇺 | Australia |
| US | 🇺🇸 | United States |
| CA | 🇨🇦 | Canada |
| GB | 🇬🇧 | United Kingdom |
| NZ | 🇳🇿 | New Zealand |
| GLOBAL | 🌐 | Global |

---

### Phase 5: Add Region Tags to Gift Card Items

Update `SimpleGiftCardItem` to display a small region badge in the corner.

**Updated Layout:**
```text
┌────────────────────────────┐
│  [Gift Card Image]    🇦🇺  │  <- Region badge in corner
│                            │
├────────────────────────────┤
│  Brand Name                │
└────────────────────────────┘
```

**Changes to `src/components/team/SimpleGiftCardItem.tsx`:**
- Import and use `RegionBadge` component
- Position badge in top-right corner of the image area
- Use subtle styling that doesn't obstruct the brand image

---

### Phase 6: Platform Admin - Region Assignment UI

Add a multi-select region picker to `CompanyDetailsCard` for platform admins.

**UI Design:**
```text
┌─────────────────────────────────────────────────────────────┐
│ Company Details                                             │
├─────────────────────────────────────────────────────────────┤
│ [Logo] Acme Corp                                            │
│ ────────────────────────────────────────────────────────────│
│ Environment: [Test ○───● Live]                              │
│ ────────────────────────────────────────────────────────────│
│ Gift Card Regions:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [x] 🇦🇺 Australia (AUD)                                 │ │
│ │ [x] 🇺🇸 United States (USD)                             │ │
│ │ [ ] 🇨🇦 Canada (CAD)                                    │ │
│ │ [ ] 🇬🇧 United Kingdom (GBP)                            │ │
│ │ [x] 🌐 Global                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ℹ️ Team members will see gift cards from selected regions  │
└─────────────────────────────────────────────────────────────┘
```

**New Components/Hooks:**
- `src/hooks/useCompanyRegions.ts` - Fetch/update company regions
- `src/hooks/useAvailableRegions.ts` - Fetch all regions from `giftbit_regions`
- Multi-checkbox region selector in `CompanyDetailsCard`

---

### Phase 7: Company Admin - View Assigned Regions (Read-Only)

Show company admins their assigned regions in the Settings page, but they cannot change them (platform admin control only).

**Add to `CompanyInformationCard.tsx`:**
```text
┌─────────────────────────────────────────────────┐
│ Company Information                     [Edit]  │
├─────────────────────────────────────────────────┤
│ Company Name: Acme Corp                         │
│ Address: 123 Main St                            │
│ Website: https://acme.com                       │
│                                                 │
│ Gift Card Regions                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🇦🇺 Australia  🇺🇸 United States  🌐 Global │ │
│ └─────────────────────────────────────────────┘ │
│ ℹ️ Contact support to modify available regions │
└─────────────────────────────────────────────────┘
```

---

### Phase 8: Multi-Region Sync for Platform Admin

Update the `EnvironmentSyncCard` to allow syncing multiple regions at once.

**Enhanced Sync UI:**
```text
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Production Catalog                              [LIVE]   │
├─────────────────────────────────────────────────────────────┤
│ Select Regions to Sync:                                     │
│ [x] 🇦🇺 Australia    [x] 🇺🇸 United States                  │
│ [x] 🇨🇦 Canada       [ ] 🇬🇧 United Kingdom                  │
│ [x] 🌐 Global                                               │
│                                                             │
│ Synced Brands by Region:                                    │
│ 🇦🇺 AU: 45 brands ✓                                         │
│ 🇺🇸 US: 120 brands ✓                                        │
│ 🇨🇦 CA: 0 brands (not synced)                               │
│ 🌐 GLOBAL: 15 brands ✓                                      │
│                                                             │
│ [Sync Selected Regions]  [Test API]                         │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Add multi-region selector to `EnvironmentSyncCard`
- Update `useSyncGiftCards` to accept array of regions
- Sync each selected region sequentially
- Show per-region brand counts

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/team/RegionBadge.tsx` | Display region flag and code |
| `src/hooks/useCompanyRegions.ts` | Fetch/update company's assigned regions |
| `src/hooks/useAvailableRegions.ts` | Fetch all available regions from DB |
| `src/components/platform/CompanyRegionSelector.tsx` | Multi-select for platform admins |

### Files to Modify

| File | Changes |
|------|---------|
| Database (migration) | Create `company_regions` junction table with RLS |
| `supabase/functions/get-rewards-shop/index.ts` | Filter by company regions, include region_code |
| `src/hooks/useRewardsShop.ts` | Add `region_code` to GiftCard interface |
| `src/components/team/SimpleGiftCardItem.tsx` | Add RegionBadge in corner |
| `src/components/platform/CompanyDetailsCard.tsx` | Add region multi-select |
| `src/components/settings/CompanyInformationCard.tsx` | Show assigned regions (read-only) |
| `src/components/platform/EnvironmentSyncCard.tsx` | Multi-region sync selector |
| `src/hooks/useSyncGiftCards.ts` | Support syncing multiple regions |
| `src/integrations/supabase/types.ts` | Regenerate types |

### Region Code Constants

```typescript
export const REGION_FLAGS: Record<string, string> = {
  AU: '🇦🇺',
  US: '🇺🇸',
  CA: '🇨🇦',
  GB: '🇬🇧',
  NZ: '🇳🇿',
  GLOBAL: '🌐'
};

export const REGION_NAMES: Record<string, string> = {
  AU: 'Australia',
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  NZ: 'New Zealand',
  GLOBAL: 'Global'
};
```

---

## Implementation Sequence

1. **Database Migration** - Create `company_regions` junction table with RLS policies
2. **Edge Function Update** - Modify `get-rewards-shop` to use company regions
3. **Region Badge Component** - Create reusable flag badge
4. **Shop UI Update** - Add region tags to gift card items
5. **Available Regions Hook** - Fetch regions from `giftbit_regions`
6. **Company Regions Hook** - Manage company-region assignments
7. **Platform Admin UI** - Add region selector to company details
8. **Company Admin UI** - Display assigned regions read-only
9. **Multi-Region Sync** - Update sync cards for batch region sync

---

## Default Behavior

When a company has no regions assigned:
- Default to showing AU brands (maintains current behavior)
- Platform admin sees "No regions assigned - defaulting to Australia"
- Encourages explicit region assignment

---

## Testing Checklist

After implementation:
- [ ] Sync multiple regions (AU, US, GLOBAL) from platform admin catalog
- [ ] Assign AU + US regions to a test company
- [ ] Verify shop shows brands from both regions with correct tags
- [ ] Confirm region badges display correctly with flag emojis
- [ ] Test company admin can see but not edit regions
- [ ] Verify brands without region match fallback behavior
- [ ] Test redemption still works with multi-region setup
