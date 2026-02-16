

# Celebrations Tab UI Redesign

## Overview
Three changes to the Celebrations settings tab: switch input from points to dollars, merge the configuration and cost estimator into a single condensed card, and bring the wallet/Buy Points CTA higher on the page.

## Change 1: Dollar Input Instead of Points

Currently admins type a number of points (e.g. "100 points per birthday"). Instead, they'll type a dollar amount (e.g. "$5.00 per birthday") and see the auto-calculated points below it.

- Input fields change from "Points per birthday" to "Dollar value per birthday" with a `$` prefix
- Below each input, a helper line shows: "= X points at current rate"
- Under the hood, the dollar value is converted to points using the exchange rate before saving to the DB (the DB columns still store points)
- On load, the existing point values are converted back to dollars for display

**Example:** If exchange rate is $0.05/point and admin types "$5.00", the helper shows "= 100 points" and 100 is saved to the DB.

## Change 2: Condensed Two-Column Layout

Merge the "Celebration Rewards" config card and the "Cost Estimator & Company Wallet" card into a single card with a two-column layout on desktop:

```text
+----------------------------------------------+
| Celebration Rewards                           |
| Automatically reward team members...          |
+----------------------+-----------------------+
| LEFT COLUMN          | RIGHT COLUMN          |
|                      |                       |
| [Switch] Birthday    | Cost Estimator        |
|   $ [___] per bday   | Birthday: $X/yr       |
|   = 100 pts          | Anniversary: $X/yr    |
|                      | ──────────────         |
| [Switch] Anniversary | Total: $X/yr          |
|   $ [___] per anniv  |                       |
|   = 200 pts          | Wallet: 5,000 pts     |
|                      | $250.00 value         |
| [Save Settings]      | [Buy Points]          |
+----------------------+-----------------------+
| Low balance warning (full width, if needed)   |
+----------------------------------------------+
```

On mobile, the two columns stack vertically (config first, then estimator/wallet).

## Change 3: Buy Points Higher on Screen

Because the config and estimator are now in a single card, the wallet balance and "Buy Points" button appear in the right column -- visible immediately without scrolling past two separate cards.

## Technical Details

### File Modified: `src/components/settings/CelebrationSettingsCard.tsx`

**State changes:**
- Replace `birthdayPoints` / `anniversaryPoints` (string of points) with `birthdayDollars` / `anniversaryDollars` (string of dollar amounts)
- On load, convert DB points to dollars: `dollars = points * rate`
- On save, convert dollars back to points: `points = Math.round(dollars / rate)`

**Layout changes:**
- Remove the second `<Card>` (Cost Estimator & Wallet)
- Add a `grid grid-cols-1 md:grid-cols-2 gap-6` inside the first card's `<CardContent>`
- Left column: birthday/anniversary toggles + inputs + save button
- Right column: cost breakdown + wallet balance + Buy Points button + low balance warning

No database changes needed -- the DB still stores points, the conversion is purely in the UI layer.

