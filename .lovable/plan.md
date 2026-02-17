

# Dashboard Layout and Leaderboard Improvements

## Overview
Four changes to the admin dashboard: limit leaderboard to top 5, add a person/department toggle, match component heights, and make the recognition feed fill its parent height.

## Change 1: Leaderboard Top 5

In `src/components/points/LeaderboardCard.tsx`, change `.slice(0, 10)` to `.slice(0, 5)` so only the top 5 members are shown.

## Change 2: Department Toggle on Leaderboard

Add a toggle (two small tabs: "Person" / "Department") below the card title in `LeaderboardCard.tsx`.

- **Person view** (current): shows individual members ranked by recognition points received
- **Department view**: aggregates recognition points by department, ranks departments, shows department name and total points

Implementation:
- Add a `viewMode` state: `'person' | 'department'`
- Two small toggle buttons in the card header
- When `viewMode === 'department'`, group the fetched data by `department` field, sum points per department, sort descending, show top 5
- Department rows use a folder/building icon instead of avatar initials
- Rank badges remain the same (gold, silver, bronze)

## Change 3: Match Component Heights

The left column (GivePointsCard + LeaderboardCard) and right column (RecognitionFeed) should have equal height.

In `src/pages/admin/Dashboard.tsx`, update the grid layout:
- Add `min-h-0` to the grid container
- Make the left column use `flex flex-col gap-6` (already does)
- Make the right column use `h-full` with a flex container that stretches to match

The key fix: wrap the two-column grid in a container that uses `grid-rows` to ensure both columns stretch equally. Specifically, set the grid to `items-stretch` so both columns match height.

## Change 4: Feed Scrolls Full Height

In `src/components/points/RecognitionFeed.tsx`, remove the hardcoded `h-[600px]` on CardContent (line 508) and replace it with `flex-1 min-h-0` so the feed expands to fill the full height of its parent card. The card itself already has `h-full`.

Update the Card wrapper to use `flex flex-col` so the content area can grow, and ensure the scroll container fills available space.

## Technical Details

### Files Modified

**`src/components/points/LeaderboardCard.tsx`**
- Add `viewMode` state with `'person' | 'department'` toggle
- Add toggle UI in CardHeader (two small pill buttons)
- Reduce `.slice(0, 10)` to `.slice(0, 5)`
- Add department aggregation logic when `viewMode === 'department'`
- Department view shows department name, total points, and rank badge

**`src/components/points/RecognitionFeed.tsx`**
- Line 498: Add `flex flex-col` to the Card
- Line 508: Replace `h-[600px]` with `flex-1 min-h-0 overflow-hidden` on CardContent, and ensure the inner scroll div uses `overflow-y-auto h-full`

**`src/pages/admin/Dashboard.tsx`**
- Update the grid to ensure both columns stretch to the same height using `items-stretch` or equivalent
- Left column already uses `flex flex-col gap-6`; the LeaderboardCard should get `flex-1` so it stretches to fill remaining space

