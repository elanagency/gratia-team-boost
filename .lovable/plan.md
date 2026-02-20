

# Client Feedback: Celebration Settings and Buy Points Dialog

## Changes

### 1. Cost estimator employee count -- count all team members, not just active

**File: `src/components/settings/CelebrationSettingsCard.tsx`**

- Change the member count query (lines 83-95) to remove the `.eq("status", "active")` filter, so it counts all employees on the team list (invited, active, etc.)
- Update the query key from `"company-active-member-count"` to `"company-member-count"`
- Update the label text (currently line ~247: `"Based on {employees} active employee{s}"`) to say **"Based on X employees"** (removing the word "active")

### 2. Buy Points dialog -- switch to dollar-based quick select and input

**File: `src/components/settings/BuyPointsDialog.tsx`**

- Change `QUICK_OPTIONS` from points `[500, 1000, 2500, 5000]` to dollar amounts `[25, 50, 100, 250]`
- Quick select buttons display as `$25`, `$50`, `$100`, `$250`
- Rename the input from "Points quantity" to "Dollar amount" with a `$` prefix
- The state variable tracks dollars instead of points; points are calculated as `dollars / exchangeRate`
- The cost summary shows: `X points | Total $Y.00 USD`
- Minimum purchase becomes `$5` (equivalent to 100 points at $0.05/pt)
- The edge function call still sends `pointsQuantity` in points (converted from dollars before sending)

## Technical Details

- The exchange rate is already passed as a prop (`exchangeRate: number`) to the dialog
- Points conversion: `dollarAmount / exchangeRate = points` (e.g., $25 / 0.05 = 500 pts)
- No edge function changes needed -- only the UI input changes, the API still receives points

