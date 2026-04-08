

# Fix Leaderboard Spacing and Padding

## Current vs Required

| Area | Current | Required |
|------|---------|----------|
| Sidebar left padding | 15px | **30px** |
| Sidebar right padding | 18.75px | **30px** |
| Sidebar top padding | 22.5px | 22.5px (correct) |
| Gap between title and first month | 18.75px (marginBottom) | **22.5px** |
| Content area left padding (after border) | 22.5px (all sides) | **30px left** |
| Content area top padding | 22.5px | 22.5px (correct) |

## Changes in `src/pages/admin/Leaderboard.tsx`

1. **Sidebar padding** (lines 143-145): Change `paddingLeft: 15` to `30` and `paddingRight: 18.75` to `30`
2. **Title margin-bottom** (line 156): Change `marginBottom: 18.75` to `22.5`
3. **Content area padding** (line 198): Change `padding: "22.5px"` to `padding: "22.5px 22.5px 22.5px 30px"` so the left side has 30px gap from the sidebar border while keeping 22.5px top

