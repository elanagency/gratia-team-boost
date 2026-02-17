
# Fix Dashboard Layout: Left Column Drives Height

## Problem

The CSS grid uses `items-stretch`, which makes both columns match the **tallest** one. Since the Recognition Feed has many entries, it becomes the tallest -- forcing the GivePointsCard in the left column to stretch with a huge empty gap. The user wants the opposite: the left column (GivePointsCard + LeaderboardCard) should determine the overall height, and the Recognition Feed should be constrained to that height with internal scrolling.

## Approach

CSS grid alone cannot make one column constrain the other's height. The solution is to use a `ResizeObserver` to measure the left column's natural height and apply it as a `maxHeight` on the right column (on desktop only).

## Changes

### 1. `src/pages/admin/Dashboard.tsx`

- Add a `useRef` on the left column and a `useState` for its measured height
- Use a `ResizeObserver` in a `useEffect` to track the left column's height
- Remove `items-stretch` from the grid (use default `items-start` so the left column sizes naturally)
- Apply `maxHeight` + `overflow-hidden` to the right column div, tied to the measured left column height
- On mobile (single column), don't constrain the height

```tsx
const leftColRef = useRef<HTMLDivElement>(null);
const [leftColHeight, setLeftColHeight] = useState<number | undefined>();

useEffect(() => {
  const el = leftColRef.current;
  if (!el) return;
  const observer = new ResizeObserver((entries) => {
    setLeftColHeight(entries[0].contentRect.height);
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

Grid changes:
- Remove `items-stretch` from the grid class
- Left column: add `ref={leftColRef}`, keep natural sizing
- Right column: apply `style={{ maxHeight: leftColHeight }}` with `overflow-hidden` on lg screens only

### 2. `src/components/points/RecognitionFeed.tsx`

- Keep the existing `min-h-0`, `flex-col`, `overflow-y-auto` setup (already correct from previous edits)
- Ensure the Card uses `h-full` so it fills whatever height constraint is given by the parent

No additional changes needed in RecognitionFeed since the parent will now properly constrain its height.

## Result

The left column (GivePointsCard + LeaderboardCard) sizes naturally based on its content. The right column (Recognition Feed) matches that exact height. If the feed has more entries than can fit, users scroll within the card. Both columns appear symmetrical and aligned.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Add ResizeObserver to measure left column height; apply as maxHeight to right column; remove `items-stretch` |
