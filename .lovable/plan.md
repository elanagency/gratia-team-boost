

# Fix Leaderboard Sidebar Month Text Weight

## Problem
The month labels in the leaderboard sub-sidebar use `font-weight: 500` but the Figma spec shows `font-weight: 400` for both active and inactive months. This makes the text appear heavier than intended.

## Change

### `src/pages/admin/Leaderboard.tsx` (line 174)
- Change `fontWeight: 500` to `fontWeight: 400` on the month buttons
- Active month keeps `color: #0F0533`, inactive keeps `color: #9996AA` (already correct)

### Files modified
- `src/pages/admin/Leaderboard.tsx`

