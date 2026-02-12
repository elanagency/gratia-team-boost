

# Fix Custom Text Overflow in Gift Card Modal

## Problem

The right-hand content (amount tiles, recipient info) is getting pushed off the edge because the 50/50 grid split doesn't give enough room for the text side, especially with the four amount tiles.

## Solution

Change the two-column grid from equal 50/50 to roughly 40/60 (image smaller, text larger) so the right side has more breathing room.

## Changes

### File: `src/components/team/GiftCardModal.tsx`

- Change the grid class from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-5`
- Apply `md:col-span-2` to the image section (40%)
- Apply `md:col-span-3` to the info section (60%)

This gives the text/form side 60% of the width, preventing the amount tiles and other content from overflowing.

