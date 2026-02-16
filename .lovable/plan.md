

# Gift Card Shop and Redemption UX Improvements

## 1. Remove category filter bar from Gift Card Shop

The horizontal category filter (All, Prepaid Cards, Apparel, etc.) will be removed from the shop. Users will see all gift cards in a single flat list, filtered only by the search box.

### File: `src/components/team/RewardShop.tsx`
- Remove the `CategoryFilterBar` import and component
- Remove the `categoryFilter` state and `categoryCounts` memo
- Remove the category matching logic from `filteredRewards` (keep only search filter)

## 2. Show reward name as the card title in Redemption History

Currently each redemption card shows "Gift Card Redemption" as the bold title, with the brand name shown below in small grey text ("Reward: Amazon"). The title will be changed to show the brand name directly (e.g., "Amazon") in the same font/size, and the redundant "Reward:" line below will be removed.

### File: `src/components/team/RedemptionHistory.tsx`
- Line 72: Change `"Gift Card Redemption"` to `{redemption.reward?.name || "Gift Card Redemption"}`
- Lines 79-83: Remove the separate "Reward: {name}" paragraph since the info is now in the title

## 3. Remove redemption history from Profile Settings

The redemption history card at the bottom of Profile Settings is no longer needed since it lives in the Gift Cards tab.

### File: `src/pages/admin/ProfileSettings.tsx`
- Remove the `RedemptionHistory` import (line 10)
- Remove the entire second Card block (lines 165-175) containing the redemption history

## 4. Fix "View My Redemptions" link in success dialog

After redeeming a gift card, the success popup's "View My Redemptions" button currently navigates to `/dashboard/profile`. It should navigate to `/dashboard/gift-cards` and switch to the "My Redemptions" tab.

### File: `src/components/team/RedemptionSuccessDialog.tsx`
- Line 34: Change `navigate("/dashboard/profile")` to `navigate("/dashboard/gift-cards?tab=redemptions")`

### File: `src/pages/team/GiftCardShop.tsx`
- Read the `tab` URL search param and use it to control the active tab (so `?tab=redemptions` opens the My Redemptions tab directly)

