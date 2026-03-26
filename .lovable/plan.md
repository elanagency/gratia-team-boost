

## Fix Middle Column Spacing Symmetry

### Problem
The middle column has unequal padding: the grid `gap-8` provides 32px between columns, but the right column also has `pl-8` (32px extra), making the right side of the middle column appear wider than the left side. The Figma shows equal spacing on both sides of the middle column with a vertical divider centered between middle and right columns.

### Solution (Dashboard.tsx)

**Remove the grid gap and use manual padding so the border-l sits with equal space on both sides:**

- Change `gap-8` to `gap-0` on the grid
- Add `pr-8` to the left/middle column (32px right padding)
- Keep `border-l border-border pl-8` on the right column (32px left padding)

This creates symmetrical 32px spacing on both sides of the vertical divider.

### File to modify
1. `src/pages/admin/Dashboard.tsx` — lines 80-92, adjust grid gap and column padding

