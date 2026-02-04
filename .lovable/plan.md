
# Migrate Gift Card System from Goody to Giftbit

## Overview

This plan migrates the rewards shop from the Goody API to the Giftbit API, implementing:
1. **Testbed environment first** (as requested)
2. **Geolocation-based catalog filtering** for Australia

---

## Phase 1: Database Schema Changes

### 1.1 Create `giftbit_brands` table

New table to store Giftbit brand catalog:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `brand_code` | text | Giftbit brand identifier (e.g., "amazonau") |
| `name` | text | Brand display name |
| `description` | text | Brand description |
| `disclaimer` | text | Legal disclaimer |
| `image_url` | text | Brand logo/image |
| `min_price_in_cents` | integer | Minimum allowed price |
| `max_price_in_cents` | integer | Maximum allowed price |
| `allowed_prices_in_cents` | integer[] | Fixed price options (if not variable) |
| `price_is_variable` | boolean | Whether user can choose amount |
| `currency_code` | text | Currency (e.g., "AUD") |
| `region_code` | text | Region filter (e.g., "AU") |
| `environment` | text | "testbed" or "production" |
| `is_active` | boolean | Whether to show in shop |
| `last_synced_at` | timestamp | Last API sync time |
| `brand_data` | jsonb | Raw API response for reference |

### 1.2 Create `giftbit_regions` table

Store available regions for filtering:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `region_code` | text | Region code (e.g., "AU") |
| `name` | text | Display name (e.g., "Australia") |
| `currency_code` | text | Default currency |
| `environment` | text | "testbed" or "production" |

### 1.3 Update `redemptions` table

Add Giftbit-specific columns alongside existing Goody columns (for migration period):

| New Column | Type | Description |
|------------|------|-------------|
| `giftbit_gift_id` | text | Giftbit gift UUID |
| `giftbit_order_id` | text | Giftbit order reference |
| `giftbit_claim_link` | text | Direct claim URL |
| `provider` | text | "goody" or "giftbit" |

---

## Phase 2: Edge Functions

### 2.1 Create `giftbit-brand-service`

Handles catalog synchronization from Giftbit API:

**Endpoints:**
- `GET_BRANDS` - Fetch all brands for a region
- `GET_REGIONS` - Fetch available regions
- `SYNC` - Full sync of brands for environment

**Key Logic:**
```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin Trigger  │ ──▶ │  Giftbit API     │ ──▶ │  giftbit_brands │
│  (Sync Catalog) │     │  GET /brands     │     │  (Database)     │
└─────────────────┘     │  ?region=AU      │     └─────────────────┘
                        └──────────────────┘
```

**API Calls:**
- `GET /papi/v1/regions` - List available regions
- `GET /papi/v1/brands?region=AU` - Get Australian brands

### 2.2 Create `giftbit-redemption-service`

Handles reward redemptions (synchronous):

**Flow:**
```text
┌──────────┐    ┌───────────────────┐    ┌─────────────────┐
│  User    │ ──▶│ giftbit-redemption│ ──▶│ Giftbit API     │
│  Redeems │    │ -service          │    │ POST /direct_   │
└──────────┘    └───────────────────┘    │ links           │
                         │               └─────────────────┘
                         ▼                        │
                 ┌───────────────┐               │
                 │ Deduct Points │               │
                 │ Create Record │◀──────────────┘
                 │ Return Link   │  (Immediate response!)
                 └───────────────┘
```

**Key Difference from Goody:**
- Giftbit returns the `claim_link` **immediately** in the API response
- No webhook needed - simpler, faster user experience
- Status can be "completed" right away

**API Call:**
```
POST /papi/v1/direct_links
{
  "brand_code": "amazonau",
  "price_in_cents": 2500,
  "id": "unique-idempotency-key",
  "expiry": "2027-12-31"
}
```

**Response includes:**
```json
{
  "direct_links": [{
    "status": "ACTIVE",
    "link_url": "https://giftbit.com/claim/..."
  }]
}
```

### 2.3 Update `get-rewards-shop`

Modify to:
1. Query `giftbit_brands` instead of `goody_gift_cards`
2. Add IP geolocation detection
3. Filter by region based on user location

**Geolocation Approach:**
- Use Cloudflare/Vercel headers (`CF-IPCountry`, `X-Vercel-IP-Country`) 
- Or call a free IP geolocation service
- Default to Australia (`AU`) for the first customer

---

## Phase 3: Secrets Configuration

### Required Secrets

| Secret Name | Environment | Description |
|-------------|-------------|-------------|
| `GIFTBIT_API_KEY_TESTBED` | Testbed | From testbed.giftbit.com |
| `GIFTBIT_API_KEY` | Production | From www.giftbit.com (when ready) |

---

## Phase 4: Frontend Updates

### 4.1 Update `useRewardsShop.ts`

- Keep existing interface (`GiftCard`)
- Update to handle new response format
- Add region awareness

### 4.2 Update `GiftCardModal.tsx`

Change redemption service call:
```typescript
// Before
await supabase.functions.invoke('goody-redemption-service', {...});

// After
await supabase.functions.invoke('giftbit-redemption-service', {...});
```

### 4.3 Update Admin Catalog Components

- Update sync functions to call `giftbit-brand-service`
- Add region selector in admin UI
- Show region/country for each brand

---

## Phase 5: Migration Strategy

### 5.1 Parallel Running (Recommended)

1. Keep Goody functions intact during development
2. Create new Giftbit functions alongside
3. Add feature flag or environment check to switch
4. Test thoroughly in Testbed
5. Switch to Giftbit when ready

### 5.2 Data Migration

- Existing `redemptions` with `goody_*` fields remain unchanged
- New redemptions use `giftbit_*` fields
- `provider` column indicates which system was used

---

## Technical Details

### Giftbit API Authentication

```
Authorization: Bearer {API_KEY}
```

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/papi/v1/ping` | GET | Test connectivity |
| `/papi/v1/regions` | GET | List available regions |
| `/papi/v1/brands` | GET | List brands (with region filter) |
| `/papi/v1/brands/{code}` | GET | Get single brand details |
| `/papi/v1/direct_links` | POST | Create direct link reward |
| `/papi/v1/gifts/{id}` | GET | Check gift status |
| `/papi/v1/funds` | GET | Check account balance |

### Environment URLs

| Environment | Base URL | Purpose |
|-------------|----------|---------|
| Testbed | `https://api-testbed.giftbit.com/papi/v1` | Testing (no real cards) |
| Production | `https://api.giftbit.com/papi/v1` | Live rewards |

### Geolocation Implementation

```typescript
// In Edge Function
function getRegionFromRequest(req: Request): string {
  // Try Cloudflare header first
  const cfCountry = req.headers.get('CF-IPCountry');
  if (cfCountry) return cfCountry;
  
  // Fallback to default (Australia for first customer)
  return 'AU';
}
```

---

## Implementation Order

1. **Add Giftbit Testbed API key** as secret
2. **Create database migrations** (new tables)
3. **Create `giftbit-brand-service`** edge function
4. **Sync Australian brands** from Testbed
5. **Create `giftbit-redemption-service`** edge function
6. **Update `get-rewards-shop`** to use new tables
7. **Update frontend** redemption calls
8. **Test end-to-end** in Testbed
9. **Add production key** when ready
10. **Go live** with production Giftbit

---

## Files to Create/Modify

### New Files
- `supabase/functions/giftbit-brand-service/index.ts`
- `supabase/functions/giftbit-redemption-service/index.ts`
- Migration: Create `giftbit_brands` table
- Migration: Create `giftbit_regions` table
- Migration: Update `redemptions` table

### Modified Files
- `supabase/functions/get-rewards-shop/index.ts`
- `src/components/team/GiftCardModal.tsx`
- `src/hooks/useRewardsShop.ts`
- `src/integrations/supabase/types.ts` (auto-generated)
