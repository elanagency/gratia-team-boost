

# Add "View Gift Card" Link to Redemption History

## Current Situation

Your redemption history component is already set up to display the "View Gift Card" button - it's just missing the link data because of a parsing bug in the edge function.

| Component | Status |
|-----------|--------|
| RedemptionHistory component | Already has "View Gift Card" button code |
| useRedemptions hook | Already fetches `individual_gift_link` |
| Database columns | `giftbit_claim_link` and `individual_gift_link` exist but are null |

## The Problem

The Giftbit API response looks like this:
```json
{
  "direct_links": [
    "https://testbedreward.giftbit.com/getReward/dl-943326cf..."
  ]
}
```

But the current code tries to access `.link_url` on what is already a string URL.

## The Fix

### Step 1: Fix Edge Function Parsing

Update `supabase/functions/giftbit-redemption-service/index.ts`:

**Current code (lines 143-150):**
```typescript
const directLink = giftbitData.direct_links?.[0];
const claimLink = directLink.link_url;  // ❌ Wrong - directLink IS the URL
const giftId = directLink.uuid || idempotencyKey;
```

**Fixed code:**
```typescript
const claimLink = giftbitData.direct_links?.[0];  // ✅ Already a string URL
const giftId = giftbitData.campaign?.uuid || idempotencyKey;
```

### Step 2: Update Existing Redemptions (One-time fix)

For your two existing redemptions that have null links, we need to manually update them with the correct URLs from your Giftbit dashboard:

```sql
-- Update Auchan redemption
UPDATE redemptions 
SET 
  giftbit_claim_link = 'https://testbedreward.giftbit.com/getReward/dl-943326cf906c482f9f9db62cb26428c3',
  individual_gift_link = 'https://testbedreward.giftbit.com/getReward/dl-943326cf906c482f9f9db62cb26428c3'
WHERE id = 'c755104d-8274-4573-be3c-587dc85ee332';

-- Update Amazon redemption (get URL from Giftbit dashboard)
UPDATE redemptions 
SET 
  giftbit_claim_link = '<URL from Giftbit dashboard>',
  individual_gift_link = '<URL from Giftbit dashboard>'
WHERE id = '8610e637-084b-462f-a832-fceb796f7c21';
```

## Result After Fix

Once the link is saved to `individual_gift_link`:
- The "View Gift Card" button will automatically appear in redemption history
- Clicking it opens the Giftbit claim page in a new tab

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/giftbit-redemption-service/index.ts` | Fix claim link parsing (lines 143-150) |

## No Frontend Changes Needed

The RedemptionHistory component (lines 93-104) already has the button:
```tsx
{redemption.external_order_id && redemption.status === 'completed' && (
  <Button onClick={() => window.open(redemption.external_order_id!, '_blank')}>
    <ExternalLink className="h-3 w-3 mr-1" />
    View Gift Card
  </Button>
)}
```

This will work automatically once the database has the link!

