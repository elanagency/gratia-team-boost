

## Sidebar Polish: Match Figma Exactly

### Changes

| File | Change |
|------|--------|
| Copy `user-uploads://Image_Grattia.png` → `src/assets/grattia-logo-white.png` | New logo asset for sidebar |
| `src/components/dashboard/DashboardSidebar.tsx` | 1. **Logo**: Import from `@/assets/grattia-logo-white.png`, center it horizontally, size ~110x26px. 2. **Company card**: Company name Inter Medium 13px white, teammate count Inter Regular 11px white/45%. 3. **Give Recognition button**: Replace `<GivePointsDialog />` with a custom styled button that opens the dialog -- solid `#7F2BFE` background (not gradient), full sidebar width with `rounded-xl` (~13px radius), Inter Medium 14px white text saying "Give Recognition". 4. **Nav items**: Inter Medium 14px, icon + text with gap, active state `bg-white/10` with rounded corners. Add Leaderboard nav item between Analytics and Redeem Points. 5. **Spacing**: Match Figma padding/gaps (px-4 for content areas, consistent vertical spacing). |
| `src/components/points/GivePointsDialog.tsx` | Add an optional `trigger` prop so the sidebar can pass a custom trigger button instead of the default pink button. Update the component to render `{trigger}` as `DialogTrigger` when provided, otherwise use the existing default button. |

### Design specs from Figma
- **Logo**: Centered, ~110x26px
- **Company name**: Inter Medium 13px, `#FFFFFF`
- **Teammate count**: Inter Regular 11px, `#FFFFFF` at 45% opacity
- **Give Recognition button**: `#7F2BFE` fill, corner radius ~13px, Inter Medium 14px, full width within sidebar padding
- **Nav text**: Inter Medium 14px, line-height 21px, white when active, white/70 when inactive
- **Nav items**: Home, Analytics, Leaderboard, Redeem Points, Settings (admin-conditional for Analytics & Settings)

