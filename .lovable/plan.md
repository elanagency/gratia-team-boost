

# Fix Leaderboard Horizontal Scroll

## Problem
The outer wrapper uses negative margins (`lg:-mx-[60px]`) to cancel the layout padding, but the content area has `marginRight: -16` which pushes it beyond the viewport, causing horizontal scroll.

## Fix in `src/pages/admin/Leaderboard.tsx`

1. **Outer wrapper**: Add `overflow-x: hidden` to the outermost div (line 131) to prevent horizontal scrolling
2. **Content area** (line 198): Remove `marginRight: -16` — this was a leftover hack that's causing the content to exceed the viewport width

## File modified
- `src/pages/admin/Leaderboard.tsx`

