

## Fix Column Spacing and Recognition Feed Border

### 1. Adjust grid gap and add right-column separator (Dashboard.tsx)
**File: `src/pages/admin/Dashboard.tsx`**
- Increase the grid gap from `gap-6` to `gap-8` to better match the Figma spacing between columns
- Add a left border (`border-l border-border`) and left padding (`pl-8`) to the right column to create a vertical divider/breaker between the middle and right columns

### 2. Remove border from Recognition Feed (RecognitionFeed.tsx)
**File: `src/components/points/RecognitionFeed.tsx`**
- Remove the `border border-border rounded-xl` from the outer `<Card>` wrapper (line 531) — the feed should sit directly below the composer without a card border
- Also update the loading state card similarly (line 517)

### Files to modify
1. `src/pages/admin/Dashboard.tsx` — grid gap + right column border-left separator
2. `src/components/points/RecognitionFeed.tsx` — remove card border from feed

