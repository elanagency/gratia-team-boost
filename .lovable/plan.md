

## Fix Tooltip-Bar Alignment in Analytics Animation

### Problem
The tooltips are correctly anchored to the right bar index, but because they use `min-width: max-content` and `left-1/2 -translate-x-1/2` centering, wide tooltips visually overflow onto neighboring bars — making it look like "Sarah J." belongs to "Mike", etc.

### Solution
Adjust tooltip positioning per-bar so edge tooltips don't overflow onto neighbors:

**`src/components/AnalyticsShowcase.tsx`**

1. For tooltips on the leftmost bars (index 0, 1): anchor to the left instead of centering, so the tooltip extends rightward without overlapping the next bar.
2. For tooltips on the rightmost bars (index 3, 4): anchor to the right so it extends leftward.
3. For middle bars (index 2): keep centered.

Specifically, replace the tooltip's fixed `left-1/2 -translate-x-1/2` positioning with dynamic alignment based on the bar's position in the array:
- Left bars: `left-0` (no translate)
- Center bars: `left-1/2 -translate-x-1/2`
- Right bars: `right-0` (no translate)

Also adjust the arrow indicator to match the new alignment so it still points at the correct bar.

