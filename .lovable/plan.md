

# Fix Cropped Brand Logos

The brand cards are getting clipped at the edges of the gray container because the `overflow: hidden` on the `MarqueeRow` wrapper clips cards that are partially visible at the container edges. The logos themselves inside the cards also need more padding room.

## Changes

### `src/components/BrandCatalogSection.tsx`

1. **Add vertical padding to the marquee overflow container** -- change `overflow-hidden` div to include `py-1` so the top/bottom of card shadows and borders aren't clipped.
2. **Add horizontal padding** to the overflow container so cards at the edges aren't clipped -- add `px-1` as well.
3. **Increase logo max dimensions** slightly from `max-h-[40px] max-w-[100px]` to `max-h-[36px] max-w-[90px]` with `p-3` padding on the card to ensure logos have breathing room and aren't touching card edges.

Specifically:
- On the `BrandCard` wrapper div (line 39): add `p-3` padding inside the card
- On the `MarqueeRow` overflow div (line 52): add `py-1` to prevent vertical clipping of card borders/shadows
- Keep `object-contain` on images to prevent any distortion

