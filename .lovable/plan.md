

## Fix Remaining Tooltip Misalignment

### Problem
The "Marketing" tooltip on bar index 2 (Mktg) uses centered positioning (`left-1/2 -translate-x-1/2`), but because "65% Redemption Rate" is wide, it visually overflows onto bar 3 (HR).

### Solution
**`src/components/AnalyticsShowcase.tsx`**: Shift the alignment boundary so bars 0-2 are left-anchored and only bars 3-4 are right-anchored:
- Change `i <= 1 ? 'left-0'` to `i <= 2 ? 'left-0'`
- Change `i >= 3 ? 'right-0'` stays as-is, and remove the centered case
- Same adjustment for the arrow alignment

