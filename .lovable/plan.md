

# Fix Transparent Background on Sticky Table Columns

## Problem
The left-hand sticky column in the analytics data table has a semi-transparent background (`bg-muted/50`), causing the date column headers and values to bleed through when scrolling horizontally.

Looking at the screenshot: "Metric" shows "4" bleeding through from "Jan 4" behind it.

---

## Root Cause

Current styling uses semi-transparent backgrounds:
- Header cell: `bg-muted/50` (50% opacity)
- Body cells: `bg-background` (solid, but row hover is `bg-muted/50`)

When the user scrolls horizontally, the sticky column overlaps the scrolling content, and the transparency allows the underlying content to show through.

---

## Solution

Replace semi-transparent backgrounds with solid colors on the sticky column:

| Element | Current | Fixed |
|---------|---------|-------|
| Header sticky cell | `bg-muted/50` | `bg-muted` (solid) |
| Body sticky cells | `bg-background` | `bg-white` or `bg-card` (explicit solid) |

Also ensure the header row background is solid so it doesn't conflict.

---

## Technical Changes

**File:** `src/components/analytics/AnalyticsDataTable.tsx`

### Line 135-136 (Header row and sticky header cell)
Change from:
```tsx
<tr className="border-b transition-colors bg-muted/50">
  <th className="... sticky left-0 z-10 bg-muted/50 ...">
```

To:
```tsx
<tr className="border-b transition-colors bg-muted">
  <th className="... sticky left-0 z-10 bg-muted ...">
```

### Line 149 (Body sticky cell)
Change from:
```tsx
<td className="p-4 align-middle font-medium sticky left-0 z-10 bg-background border-r border-border/50">
```

To:
```tsx
<td className="p-4 align-middle font-medium sticky left-0 z-10 bg-card border-r border-border/50">
```

Using `bg-card` ensures it matches the Card component's background and is fully opaque.

---

## Visual Result

**Before:** Dates bleeding through sticky column when scrolling
**After:** Solid background on sticky column, clean separation when scrolling

