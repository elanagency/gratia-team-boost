

# Fix Analytics Filter Button Hover and Calendar Styling

## Problem
All buttons on the analytics page turn pink on hover (because `--accent` is set to `#F572FF`). The Figma shows they should hover to light gray. The calendar date selection and preset buttons ("Last 30 days") also use pink but should use the purple-to-pink gradient (`linear-gradient(135deg, #7F2BFE, #FC5BFF)`) used elsewhere in the app.

## Changes

### 1. `src/components/analytics/AnalyticsFilters.tsx`
- **Granularity buttons**: Replace `Button variant="ghost"` with plain `button` elements to avoid the pink hover. Apply `hover:bg-gray-100` for light gray hover on inactive buttons.
- **Custom date trigger**: Replace `Button variant="outline"` with a plain styled button using `hover:bg-gray-100` instead of the accent hover.
- **Preset buttons** (Last 7 days, Last 30 days, etc.): Replace `Button variant="secondary"/"ghost"` with plain buttons. Active preset gets the gradient background (`linear-gradient(135deg, #7F2BFE, #FC5BFF)`) with white text and rounded-full styling (matching the Figma screenshot). Inactive presets get `hover:bg-gray-100`.

### 2. `src/components/ui/calendar.tsx`
- Override `day_selected` to use the gradient background instead of `bg-primary` (pink). Apply `background: linear-gradient(135deg, #7F2BFE, #FC5BFF)` with white text and `rounded-[7.375px]`.
- Override `cell` and `day_range_middle` accent references to use a lighter purple tint instead of pink accent for the range highlight.

### 3. `src/pages/admin/Analytics.tsx`
- **View mode toggle** (chart/table icons): Replace `Button` variants with plain styled buttons using `hover:bg-gray-100` and a neutral active state (e.g. `bg-gray-100`) instead of `variant="secondary"` which may trigger pink.

### Files modified
- `src/components/analytics/AnalyticsFilters.tsx`
- `src/components/ui/calendar.tsx`
- `src/pages/admin/Analytics.tsx`

