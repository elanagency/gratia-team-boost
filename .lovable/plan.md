

## Fix Sidebar: Fonts, Width, and Button Icon

### Problems
1. **Inter font is not imported** -- it's referenced in class names but never loaded, so the browser falls back to a system font
2. **Sidebar width** is 260px, Figma spec is 240px
3. **Give Recognition button** has a Trophy icon that shouldn't be there

### Changes

| File | Change |
|------|--------|
| `src/index.css` | Add Inter font import: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');` |
| `src/components/dashboard/DashboardSidebar.tsx` | 1. Add `font-family: 'Inter'` to the sidebar root container via `style` or a Tailwind `font-['Inter']` class. 2. Change desktop width from `w-[260px]` to `w-[240px]`. 3. Remove `<Trophy>` icon from the Give Recognition button trigger. 4. Ensure font sizes match Figma exactly: company name 13px medium, teammate count 11px regular (font-normal), button text 14px medium, nav items 14px medium with line-height 21px, user name 13px medium, role 11px regular. |

### Figma Font Specs (confirmed from screenshots)
- **Company name**: Inter Medium 13px
- **Teammate count**: Inter Regular 11px, line-height 16.5px, white at 45% opacity
- **Give Recognition text**: Inter Medium 14px, line-height 21px, white 100%
- **Nav items**: Inter Medium 14px, line-height 21px
- **User footer**: same pattern as company card (13px name, 11px role)

