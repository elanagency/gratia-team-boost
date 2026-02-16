
# Dashboard Layout Restructure

## Current Layout
- Row 1: `GivePointsCard` (left 50%) | `RecognitionFeed` (right 50%)
- Row 2: `LeaderboardCard` (full width)

## New Layout
- Left column: `GivePointsCard` stacked on top of `LeaderboardCard` (each same width/height)
- Right column: `RecognitionFeed` spanning the full height of both rows

```text
+---------------------+---------------------+
|                     |                     |
|  Give Recognition   |                     |
|                     |  Recognition Feed   |
+---------------------+  (spans full        |
|                     |   height)           |
|  Team Leaderboard   |                     |
|                     |                     |
+---------------------+---------------------+
```

## Technical Details

### File: `src/pages/admin/Dashboard.tsx`

Change the grid layout from the current two-row approach to a single 2-column CSS grid with explicit row spanning:

- Use `grid grid-cols-1 lg:grid-cols-2` with `gap-6`
- Left column contains `GivePointsCard` then `LeaderboardCard` stacked vertically (wrapped in a flex column container)
- Right column contains `RecognitionFeed` with `lg:row-span-2` so it stretches the full height of both left-column cards
- Remove the separate bottom `<div>` for the leaderboard since it moves into the left column

On mobile (below `lg`), all three cards stack vertically in order: Give Recognition, Leaderboard, Recognition Feed.
