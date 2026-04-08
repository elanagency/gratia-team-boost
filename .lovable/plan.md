

# Fix Granularity Toggle Pill Roundedness

## Problem
The Figma screenshots show the granularity container has `border-radius: 13.375px` with `background: #F5F5F7` and `height: 33px`, and the active pill inside has `border-radius: 7.375px`. Currently the container uses `rounded-[7.375px]` (should be `13.375px`) and has a white background with a border instead of the `#F5F5F7` fill. The individual pills also clip their corners with `rounded-r-none` / `rounded-l-none` which prevents proper pill shaping.

## Change

### `src/components/analytics/AnalyticsFilters.tsx` (lines 106-123)
- Container: change `rounded-[7.375px]` to `rounded-[13.375px]`, remove `border`, change `bg-background` to `bg-[#F5F5F7]`, add `h-[33px] p-[1.875px]`
- Individual buttons: remove the `rounded-r-none` / `rounded-l-none` / `rounded-none` overrides so all pills keep full `rounded-[7.375px]`
- Adjust padding to roughly match Figma (`px-[11px] py-[6px]`)

### Files modified
- `src/components/analytics/AnalyticsFilters.tsx`

