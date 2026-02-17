

# Fix Recognition Feed Scroll Containment

## Problem

The Recognition Feed card grows in height with every new entry, pushing the page layout taller and breaking visual symmetry with the left column (Give Points + Leaderboard). The feed should be contained to match the left column's height, with internal scrolling for overflow content.

## Root Cause

In `src/pages/admin/Dashboard.tsx`, the two-column grid uses `items-stretch` so both columns match the tallest one. But because the feed content has no height constraint, it keeps growing and becomes the tallest element -- defeating the purpose of `items-stretch`.

## Solution

Two small changes:

### 1. `src/pages/admin/Dashboard.tsx` -- Constrain the right column

Wrap the grid in a container that establishes a fixed reference height. The right column should use `overflow-hidden` so the feed is forced to scroll internally rather than grow the grid.

```tsx
{/* Right Column - Recognition Feed spanning full height */}
<div className="h-full min-h-0 overflow-hidden">
  <RecognitionFeed />
</div>
```

### 2. `src/components/points/RecognitionFeed.tsx` -- Add proper scroll containment

The card already uses `flex flex-col` and the content area has `flex-1 min-h-0`. The scrollable div (line 510) just needs proper height constraints to work within the flex layout:

- Change the outer Card to include `min-h-0 overflow-hidden` alongside `h-full flex flex-col`
- Ensure the scrollable content div uses `overflow-y-auto` with proper flex containment

```tsx
// Line 498: Card wrapper
<Card className="dashboard-card h-full flex flex-col min-h-0 overflow-hidden">

// Line 510: Scrollable content area  
<div className="space-y-6 flex-1 overflow-y-auto min-h-0">
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Add `min-h-0 overflow-hidden` to right column wrapper |
| `src/components/points/RecognitionFeed.tsx` | Add `min-h-0 overflow-hidden` to Card; ensure scroll container is properly constrained |

## Result

The Recognition Feed will match the left column height exactly and scroll internally, keeping the dashboard layout clean and symmetrical.

