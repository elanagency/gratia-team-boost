

# Fix "Add Points" Dropdown Styling to Match Figma

## Problem
The +1, +5, +10 quick-points popover that appears when clicking "+ Add Points" on recognition feed items doesn't match the Figma design. Currently it uses generic border/rounded-full styling; the Figma shows green text on a light green (`#DCFCE7`) background with `7.375px` border-radius and specific padding.

## Change

### `src/components/points/RecognitionFeed.tsx` (lines ~661-673)
- Update the `PopoverContent` to remove default padding/border styling
- Update each `+1`, `+5`, `+10` button to match Figma:
  - `background: #DCFCE7`
  - `color: #15803D`
  - `border-radius: 7.375px`
  - `padding: 6.125px 11.25px 5.125px 10.25px`
  - `font-size: 14px`, `font-weight: 500`
  - Remove the border (or make it match the green bg)
- Ensure the popover container itself is clean (no extra border, minimal padding, rounded corners)

### Files modified
- `src/components/points/RecognitionFeed.tsx`

