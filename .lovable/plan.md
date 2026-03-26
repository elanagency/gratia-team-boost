
Fix the actual visible sidebar width in `src/components/dashboard/DashboardSidebar.tsx`.

What’s really happening:
- I traced the live `/dashboard` route and confirmed it uses `UnifiedDashboardLayout` → `DashboardSidebar`.
- The file already has `w-[450px]` on the outer `<aside>`, so your previous requests were technically applied.
- But the dark visible sidebar is the inner `sidebarContent` `<div>`, and it does not stretch to fill that 450px container.
- So the extra width is mostly invisible empty space, which is why it looks unchanged.

Implementation plan:
1. Update the root `sidebarContent` wrapper to explicitly fill the parent width:
   - add `w-full`
   - add `min-w-0` if needed for text/layout stability
2. Keep the desktop `<aside>` at the requested width and ensure the mobile sheet uses the same visible width behavior.
3. Verify there are no competing sidebar components on this route and leave the old unused sidebar files untouched.
4. Re-check the sidebar proportions after the width-fill fix; if needed, tune internal horizontal padding separately so the sidebar matches Figma more closely.

Files involved:
- `src/components/dashboard/DashboardSidebar.tsx`
- Confirmed route source: `src/pages/dashboard/UnifiedDashboardLayout.tsx`

Technical note:
- The bug is not “the wrong component is rendering.”
- The bug is “the widened parent exists, but the child panel doesn’t occupy that width.”
- That is why font changes appeared but width changes did not.

Expected result after implementation:
- The purple/dark sidebar itself will visibly become wider instead of staying at the same apparent width.
- Your 450px request should finally look obviously different.

