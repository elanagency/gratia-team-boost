

## Reduce FAQ Section Min-Height

The current `min-h-[700px]` is too generous, leaving excessive empty space. Based on the screenshots, the tallest expanded state (e.g., "Pricing & Value" with 4 items, one expanded) needs roughly 500px.

### Change — `src/components/FAQSection.tsx`
- Line 138: Change `min-h-[700px]` to `min-h-[500px]`

This keeps enough reserved space to prevent layout shifts when an item is expanded, while eliminating the large empty gap below the FAQ items.

