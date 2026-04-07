

## Fix Leaderboard Rank Colors

### Problem
Currently all 5 rank numbers use `#7F2BFE` (purple). Per the Figma, only ranks 1-3 should be purple. Ranks 4-5 should use `#9996AA` (muted gray).

### Change in `src/components/points/LeaderboardCard.tsx`

**Line 161** — Make the rank color conditional:
- Ranks 1-3: `color: "#7F2BFE"` (purple)
- Ranks 4-5: `color: "#9996AA"` (gray)

Single line change: `color: member.rank <= 3 ? "#7F2BFE" : "#9996AA"`

### File to modify
1. `src/components/points/LeaderboardCard.tsx` — line 161, rank color conditional

