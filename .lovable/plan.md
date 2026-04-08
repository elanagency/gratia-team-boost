

# Fix Leaderboard Content Area Padding

## Problem
The `UnifiedDashboardLayout` wrapper (line 106) applies `p-4 pt-16 lg:px-[60px] lg:pt-[72px]` to ALL child pages. The Leaderboard page then adds its own `padding: "22.5px 22.5px 22.5px 30px"` on top, resulting in ~95px top padding and ~90px left padding — far too much.

## Solution
Override the layout wrapper padding on the Leaderboard content area so the final spacing matches the sidebar: **22.5px top, 30px left**.

### Changes in `src/pages/admin/Leaderboard.tsx`
- Add negative margins or use absolute positioning on the content wrapper to cancel the layout's padding
- Specifically: apply `margin: -72px -60px -16px -60px` then re-apply the correct `padding: 22.5px 22.5px 22.5px 30px` on the content area (on lg screens)
- Alternatively (cleaner): wrap the entire Leaderboard return in a container that negates the parent padding using className overrides

### Simplest approach
On the outermost wrapper of the Leaderboard component (the fragment `<>`), replace it with a div that uses negative margins to cancel the layout padding on desktop:

```
className="lg:-mx-[60px] lg:-mt-[72px] lg:-mb-4 -mx-4 -mt-16 -mb-4"
```

Then the sidebar and content area keep their own correct padding values (22.5px top, 30px left/right for sidebar; 22.5px top, 30px left for content).

### File modified
- `src/pages/admin/Leaderboard.tsx` — wrap return content in a div with negative margins to cancel layout padding

