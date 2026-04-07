

## Fix Settings Sidebar & Divider to Be Fixed/Floating

### Problem
The settings sidebar and divider sit inside the dashboard's scrollable content area (`p-4 pt-16 lg:px-[60px] lg:pt-[72px]`), so they scroll with the page and the divider doesn't reach the top.

### Solution
Use negative margins on the sidebar+divider container to pull them up and to the left, counteracting the parent padding. Make the sidebar and divider `position: fixed` so they float independently of the scroll, while the content area gets a left margin/padding to account for the fixed sidebar.

### Changes to `src/pages/admin/Settings.tsx`

1. **Remove the current flex layout** that groups sidebar + divider + content together
2. **Make the sidebar fixed**: `position: fixed`, anchored at `top: 0`, `left: 240px` (after the dashboard sidebar which is ~240px wide), full viewport height, with its own vertical padding matching the layout's `pt-[72px]`
3. **Make the divider fixed**: sits right after the sidebar column, `position: fixed`, `top: 0`, `height: 100vh`
4. **Offset the content**: add `padding-left` or `margin-left` to the content area equal to the sidebar width (~220px) + divider + gap
5. **Keep the "Settings" title** above the content, also offset to the right of the fixed sidebar

Specifically:
- Sidebar: `position: fixed; top: 0; left: 240px; width: 220px; height: 100vh; padding-top: 72px; padding-right: 18.75px; border-right: 1px solid #E8E6F0;`
- The divider becomes the sidebar's right border (simpler than a separate element)
- Content: `margin-left: 240px` (220px sidebar + ~20px gap)
- The "Settings" title sits above the content, also with the same left margin

### Files to modify
1. `src/pages/admin/Settings.tsx` — restructure to fixed sidebar with border-right as divider

