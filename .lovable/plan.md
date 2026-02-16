

# Recognition Feed Height and Leaderboard Redesign

## 1. Extend Recognition Feed scroll height

The `RecognitionFeed` card currently has `h-96` (384px) on its `CardContent`, which cuts off the scrollable area too early. Since the feed now spans two rows on the right column, it should use more vertical space.

### File: `src/components/points/RecognitionFeed.tsx`
- Line 508: Change `h-96` to `h-[600px]` to give the feed significantly more scrollable room, matching the combined height of the two left-column cards

## 2. Redesign Team Leaderboard rows

Replace the current table-based layout with a modern row-based design matching the reference image:

- Each row is a horizontal flex container (no table)
- Left side: rank number in a colored circle (gold for #1, silver for #2, bronze for #3, grey for others), followed by an avatar circle with initials, then the member's name with department below in smaller grey text
- Right side: points number in accent color, right-aligned
- Top 3 ranks get colored rank badges; ranks 4+ get a grey badge

### File: `src/components/points/LeaderboardCard.tsx`
- Remove `Table` imports and the entire table markup (lines 194-219)
- Replace with a `div`-based list where each member row uses:
  - A rank badge circle (colored by rank: gold #1, silver #2, bronze/orange #3, grey 4+)
  - An avatar circle with the member's initials (varied background colors)
  - Name (bold) with department subtitle below in grey
  - Points number right-aligned in accent color
- Keep the header, loading, empty, and admin-only states unchanged
- Remove the `Department` column header since department is shown inline under the name

