## Add Available Balance Card to Gift Cards Page

Add a new balance card above the search input on the Gift Cards tab of the Redeem Points page, matching the Figma design pixel-for-pixel.

### Visual spec (from Figma)

Container:
- Full-width card, light purple gradient background (`linear-gradient(135deg, rgba(127,43,254,0.06), rgba(252,91,255,0.06))`)
- `border-radius: 15px`, `border: 1px solid #E8E6F0`
- Padding: `19.75px` all sides
- Flex row, space-between, items center

Left side (column):
- Label "AVAILABLE BALANCE" — Inter 500, 12px, line-height 18px, letter-spacing 0.48px, uppercase, color `#9996AA`
- Row with: 
  - Number (e.g. `1,680`) — Inter 600, 28px, line-height 42px, color `#0F0533`, formatted with commas
  - Green "points" pill next to it — light green background `#DCFCE7`, text `#15803D`, Inter 600, 13px, line-height 19.5px, padding `~4px 13px`, fully rounded

Right side (column, right-aligned):
- Label "Redemption Value" — Inter 400, 12px, line-height 18px, color `#9996AA`, right-aligned
- Dollar value (e.g. `$84.00`) — Inter 600, 20px, line-height 30px, color `#0F0533`, right-aligned, always 2 decimals with thousands separators

### Data wiring

- Get `recognitionPoints` from `useAuth()` (this is the user's redeemable points balance — same source as `RedeemablePointsBox`).
- Get `exchangeRate` from `useRewardsShop()` (already used in this component, default `0.05`).
- Redemption Value = `recognitionPoints * exchangeRate`, formatted as `$X,XXX.XX` using `toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- Points formatted with `toLocaleString('en-US')` for thousands separators.

### Implementation

Edit `src/components/team/RewardShop.tsx`:
1. Import `useAuth` from `@/context/AuthContext`.
2. Read `recognitionPoints` from `useAuth()`.
3. Render the Available Balance card as the first child inside the existing `<div className="space-y-4">`, above the search input.
4. Use inline styles consistent with the rest of the file for exact pixel control.

No changes to business logic, data hooks, or the search/grid below.

### Files to modify
- `src/components/team/RewardShop.tsx`
