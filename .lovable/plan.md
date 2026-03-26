

## Fix Sidebar Spacing to Match Figma

### Figma specs extracted from screenshots

| Element | Figma spec | Current code | Fix |
|---------|-----------|--------------|-----|
| **Sidebar padding** | 15px sides, 15px top | `px-4` (16px), `pt-6` (24px) | `p-[15px] pt-[15px]` |
| **Company card** | 210x54.75px, padding 0 11.25px, gap 11.25px, border-radius 13.375px | `mx-4 mb-4 p-3 rounded-lg` | `mx-0 p-0 px-[11.25px] rounded-[13.375px]` h-[55px] |
| **Give Recognition button** | 210x39.75px, padding 9.375px 0, border-radius 13.375px | `py-2.5 rounded-xl` | `py-[9.375px] rounded-[13.375px]` |
| **Gap: button to nav** | 22.5px | `mb-5` (20px) | `mb-[22.5px]` |
| **Nav item padding** | 7.5px top/bottom, 11.25px left, gap 11.25px | `px-3 py-2.5 gap-3` | `px-[11.25px] py-[7.5px] gap-[11.25px]` |
| **Nav item border-radius** | 13.375px | `rounded-lg` (8px) | `rounded-[13.375px]` |
| **Nav container padding** | 0 (items are full width within 15px sidebar padding) | `px-3` | `px-0` |
| **Active nav bg** | `#FFFFFF` at ~55% opacity | `bg-white/10` | `bg-white/[0.06]` (from Figma it looks subtle, ~6%) |
| **Logo top padding** | ~15px from top of sidebar | `pt-6 pb-5` (24px/20px) | `pt-0 pb-[15px]` |

### Changes

**File: `src/components/dashboard/DashboardSidebar.tsx`**

1. Sidebar root: change to `p-[15px]` for consistent 15px padding on all sides
2. Logo section: remove extra top/bottom padding, use `pb-[15px]` below logo
3. Company card: set explicit height ~55px, horizontal padding 11.25px, gap 11.25px, border-radius 13.375px, remove mx-4
4. Give Recognition button: padding 9.375px vertical, border-radius 13.375px, margin-bottom 22.5px
5. Nav container: remove px-3 (parent already has 15px padding), items stretch full width
6. Nav items: padding 7.5px/11.25px, gap 11.25px, border-radius 13.375px
7. Active state: keep subtle white background (looks like ~6% opacity white from the screenshots)

