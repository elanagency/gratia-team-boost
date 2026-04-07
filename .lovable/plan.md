

## Redesign Leaderboard Card to Match Figma

### Figma Specs (from screenshots)

**Container**: Border `1px solid #E8E6F0`, rounded corners, no shadow/card styling. Padding 15px on header row.

**Header row**: 
- "Leaderboard" — Inter, 14px, weight 600, color #0F0533
- "View all >" link — Inter, 12px, weight 400, color #9996AA, with chevron icon (14x14)
- `justify-content: space-between`, `align-items: center`, height ~44.5px, padding `0 15px`, border-bottom `1px solid #E8E6F0`

**Each leaderboard row**:
- `display: flex`, height ~54.75px, padding `0 15px`, `align-items: center`, gap `11.25px`
- Border-bottom `1px solid #E8E6F0` (except last row)
- **Rank**: Inter, 12px, weight 600, color `#7F2BFE`, text-align center
- **Avatar**: ~37px circle with initials
- **Name**: Inter, 13px, weight 500, color `#0F0533`
- **Department**: Inter, 11px, weight 400, color `#9996AA`, line-height 16.5px
- **Points**: Inter, 13px, weight 600, color `#0F0533`, right-aligned — number only (e.g. "2,450"), no "pts" suffix

**Key differences from current**:
- Remove Card/CardHeader/CardContent wrappers
- Remove Trophy icon, Person/Department toggle, CardDescription
- Remove colored rank badges (yellow/silver/bronze circles) — just purple number
- Remove "pts" suffix
- Add "View all >" with chevron
- Show top 5 only (person view only, remove department toggle for sidebar version)

### Changes to `src/components/points/LeaderboardCard.tsx`

- Replace entire render with a clean `div` using `rounded-[13.375px] border border-[#E8E6F0] overflow-hidden`
- Header: flex row with "Leaderboard" title and "View all >" link
- Body: list of 5 rows, each with border-bottom except last
- All typography via inline styles for Inter font
- Keep data fetching logic unchanged, just simplify to person view only (no toggle)

### File to modify
1. `src/components/points/LeaderboardCard.tsx`

