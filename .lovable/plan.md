
# Enable Production Giftbit Integration

## Overview

This plan adds the production Giftbit API key and ensures the entire production gift card flow works correctly - from region selection during onboarding to gift card redemption.

---

## Step 1: Add the Production API Key Secret

I will add the `GIFTBIT_API_KEY` secret so you can paste your production key. Once approved, a secure input box will appear for you to enter the key.

**Secret Details:**
| Secret Name | Purpose | Used By |
|-------------|---------|---------|
| `GIFTBIT_API_KEY` | Production Giftbit API access | `giftbit-brand-service`, `giftbit-redemption-service` |

---

## Step 2: Verify Edge Functions Configuration

The edge functions are already correctly configured to use the production key:

**`giftbit-brand-service/index.ts` (line 167-169):**
```typescript
const apiKey = environment === 'production' 
  ? Deno.env.get('GIFTBIT_API_KEY')      // ← Production key
  : Deno.env.get('GIFTBIT_API_KEY_TESTBED');
```

**`giftbit-redemption-service/index.ts` (line 77-79):**
```typescript
const apiKey = environment === 'production' 
  ? Deno.env.get('GIFTBIT_API_KEY')      // ← Production key
  : Deno.env.get('GIFTBIT_API_KEY_TESTBED');
```

No code changes needed - the logic is already in place.

---

## Step 3: Sync Production Regions

After the secret is added, sync regions for the production environment:

1. Navigate to **Platform Admin > Gift Cards Catalog**
2. Select the **Production Catalog** tab
3. Click **Sync Regions** in the Environment Sync Card

This will populate `giftbit_regions` with `environment = 'production'` entries, fixing the empty dropdown in the Region Setup Dialog.

---

## Step 4: Test the Production Flow

| Test | Action | Expected Result |
|------|--------|-----------------|
| Region Setup | New company signup | Dropdown shows production regions (AU, US, GB, etc.) |
| Region Sync | Platform Admin syncs brands | Brands appear in Production Catalog |
| Redemption | Team member redeems gift card | Real gift card link generated via production API |

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| None | — | No code changes needed, configuration only |

---

## Implementation Steps

1. **Add Secret** - I'll invoke the secret tool to show you the input box for `GIFTBIT_API_KEY`
2. **You paste the key** - Enter your production Giftbit API key
3. **Sync regions** - Use Platform Admin to sync production regions
4. **Test** - Verify the onboarding dropdown and redemption flow work

---

## Summary

| Component | Status | After This Plan |
|-----------|--------|-----------------|
| `GIFTBIT_API_KEY_TESTBED` | ✅ Configured | No change |
| `GIFTBIT_API_KEY` | ❌ Missing | ✅ Added |
| Production regions in DB | ❌ Empty | ✅ Synced via Platform Admin |
| Region Setup Dialog | ❌ Empty dropdown | ✅ Shows production regions |
| Gift card redemption | ❌ Would fail | ✅ Works with production API |
