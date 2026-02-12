

# Add "My Redemptions" Tab to Gift Cards Page

## Overview

Add a tabbed interface to the Gift Cards page (`/dashboard/gift-cards`) with two tabs:
- **Shop** (default) -- the existing gift card browsing experience
- **My Redemptions** -- shows the user's redemption history, reusing the existing `RedemptionHistory` component

## Changes

### File: `src/pages/team/GiftCardShop.tsx`

- Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from the UI library
- Import the existing `RedemptionHistory` component from `@/components/team/RedemptionHistory`
- Wrap the page content in a `Tabs` component with two tabs:
  - "Shop" tab containing the existing `RewardShopComponent`
  - "My Redemptions" tab containing the `RedemptionHistory` component
- The tabs will use the same styling pattern as the Settings page tabs

No new components, hooks, or database changes are needed -- just composing existing pieces together.

