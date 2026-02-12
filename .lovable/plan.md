

# Add Category Filtering to Gift Cards Catalog

## Approach

Since the Giftbit API does not return categories in brand data, we will create our own category system with two layers:

1. **Auto-categorisation** -- A keyword-to-category mapping that automatically assigns categories to brands based on their name (e.g., "Starbucks" -> Restaurants, "Adidas" -> Apparel)
2. **Database storage** -- A new `category` column on the `giftbit_brands` table so categories persist and can be manually overridden by platform admins later

## Categories (matching the Giftbit website)

- Prepaid Cards
- Apparel
- Destinations
- Entertainment
- Food & Drink
- Home
- Lifestyle
- Online Shopping
- Restaurants
- Wellness

Plus an "Other" fallback for brands that don't match any keyword.

## Changes

### 1. Database: Add `category` column

Add a text column `category` to the `giftbit_brands` table to store the assigned category per brand.

### 2. New utility: Category mapping (`src/lib/giftCardCategories.ts`)

A new file containing:
- The list of category names and their display icons
- A `BRAND_CATEGORY_MAP` dictionary mapping known brand keywords to categories (e.g., `"starbucks" -> "Restaurants"`, `"nike" -> "Apparel"`, `"airbnb" -> "Destinations"`)
- A `getCategoryForBrand(brandName)` function that matches brand names against the map, with "Other" as fallback

This map will cover the most common brands (50-100 mappings). Unmapped brands fall into "Other".

### 3. Edge function update: Assign categories during sync

**File: `supabase/functions/giftbit-brand-service/index.ts`**

During the `SYNC_BRANDS` action, after fetching brands, assign a category to each brand using the keyword mapping before upserting into the database.

### 4. Platform Catalog: Add category filter bar

**File: `src/pages/platform/PlatformGiftCardsCatalog.tsx`**

- Add a horizontal scrollable row of category pills/buttons (similar to the Giftbit website screenshot) above the existing search/filter row
- Each pill shows an icon and category name
- Clicking a category filters the grid; clicking again deselects it
- "All" button to clear the category filter
- Show count of brands per category

### 5. Team Reward Shop: Add category filter

**File: `src/components/team/RewardShop.tsx`**

- Add the same category filter bar for team members browsing the gift card shop
- Filter the displayed gift cards by selected category

### 6. Backfill existing brands

Run a one-time update on existing `giftbit_brands` rows to assign categories based on the keyword mapping, so existing synced brands get categorised without needing a re-sync.

## Technical Details

### Category keyword mapping structure

```
const BRAND_CATEGORY_MAP: Record<string, string> = {
  "amazon": "Online Shopping",
  "ebay": "Online Shopping",
  "airbnb": "Destinations",
  "hotels": "Destinations",
  "adidas": "Apparel",
  "nike": "Apparel",
  "starbucks": "Restaurants",
  "uber eats": "Food & Drink",
  "spotify": "Entertainment",
  "amc": "Entertainment",
  "sephora": "Lifestyle",
  "spa": "Wellness",
  "visa": "Prepaid Cards",
  "mastercard": "Prepaid Cards",
  // ... 50-100 more mappings
};
```

### Category filter UI

A horizontal row of clickable chips, each with an icon (using Lucide icons like `ShoppingBag`, `Plane`, `Film`, `UtensilsCrossed`, `Home`, `Heart`, `Globe`, `Store`, `Sparkles`, `CreditCard`). Active category gets the accent colour highlight. This sits between the environment tabs and the search bar.

### Files to create
- `src/lib/giftCardCategories.ts` -- category definitions, icons, and keyword mapping

### Files to modify
- `supabase/functions/giftbit-brand-service/index.ts` -- assign category during sync
- `src/pages/platform/PlatformGiftCardsCatalog.tsx` -- add category filter bar
- `src/components/team/RewardShop.tsx` -- add category filter bar
- `src/hooks/useGiftbitBrands.ts` -- support category filter parameter
- `src/hooks/useRewardsShop.ts` -- support category filter

### Database migration
- `ALTER TABLE giftbit_brands ADD COLUMN category TEXT DEFAULT 'Other'`
- Backfill query using CASE/WHEN on brand name patterns

