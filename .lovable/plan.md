

## Fix Upcoming Celebrations Padding

### Problem
The content area uses `padding: "11.25px 15px 0 15px"` — missing bottom padding. Combined with the flex gap and conditional paddingBottom on rows, single-item scenarios look unbalanced (no bottom padding at all).

### Figma Specs (from screenshot)
The content container uses: `padding: 11.25px 15px 0 15px`, `height: 153px`, `flex-direction: column`, `gap: 11.25px`. The rows themselves have internal vertical spacing from the gap, and each row separator uses paddingBottom + borderBottom. The last row needs bottom padding to balance.

### Fix in `src/components/dashboard/UpcomingCelebrations.tsx`

**Line 86** — Change content div padding from `"11.25px 15px 0 15px"` to `"11.25px 15px 11.25px 15px"` so there's equal padding top and bottom of the content area.

**Line 103** — The last row currently gets `paddingBottom: "0"`. This is fine now that the container itself has bottom padding.

This ensures that even with a single item, there's consistent 11.25px spacing above and below the content.

### File to modify
1. `src/components/dashboard/UpcomingCelebrations.tsx` — line 86, add bottom padding

