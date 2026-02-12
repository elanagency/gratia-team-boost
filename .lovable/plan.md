

# Update Redemption Amount Options with Custom Amount

## Overview

Change the four fixed amount tiles from $15/$20/$25/$30 to $5/$10/$20/Custom, where the "Custom" tile opens an inline input for typing a custom dollar amount.

## Changes

### File: `src/components/team/RewardInfo.tsx`

- Change `dollarAmounts` from `[15, 20, 25, 30]` to `[5, 10, 20]` (three fixed options)
- Add a `customAmount` state (string) and `isCustom` state (boolean)
- Add a fourth tile labeled "Custom" that, when clicked, sets `isCustom = true` and deselects fixed amounts
- When "Custom" is selected, show an inline dollar input field inside the tile (or directly below) where the user types a number
- Auto-calculate points cost as the user types using the existing `getPointsForAmount` function
- Set the `selectedAmount` to the parsed custom value so the rest of the redemption flow works unchanged
- Validate custom amount is a positive number and within the gift card's min/max price range (if available from `reward.min_price_in_cents` / `reward.max_price_in_cents`)
- Clicking a fixed tile deselects custom mode

### Technical Details

**New state variables:**
- `isCustomMode: boolean` -- whether the custom tile is active
- `customAmountInput: string` -- raw text input value

**Custom tile behavior:**
- First click activates custom mode and shows an input
- The input has a "$" prefix and accepts only numbers
- Points display updates live as the user types
- If the parsed value is invalid or zero, the redeem button stays disabled
- `selectedAmount` is set to `parseFloat(customAmountInput)` when in custom mode

**Validation:**
- Must be a positive whole number
- If `reward.min_price_in_cents` exists, enforce minimum (converted to dollars)
- If `reward.max_price_in_cents` exists, enforce maximum (converted to dollars)

