
Increase the sidebar width again from 350px to 450px in `src/components/dashboard/DashboardSidebar.tsx`.

What to change:
- Desktop sidebar: `w-[350px]` → `w-[450px]`
- Mobile sheet: `w-[350px]` → `w-[450px]`

Why:
- The current file confirms the sidebar is still set to 350px, so moving to 450px will create a clearly visible difference.

Technical note:
- Your current viewport is 1050px wide, which is above the `lg` breakpoint, so the desktop `<aside>` is the element being shown right now.
- The sidebar font is already forced to Inter via inline `style={{ fontFamily: "'Inter', sans-serif" }}`.
- No other typography changes are needed for this request.
