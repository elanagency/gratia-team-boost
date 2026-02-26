

## Fix brand logo cropping in marquee

### Change in `src/components/BrandCatalogSection.tsx`

- On the `MarqueeRow` outer div, increase horizontal padding from `px-1` to `px-4` so the first/last cards aren't clipped by `overflow-hidden`
- Increase the container `max-w-[520px]` to `max-w-[560px]` to give more room
- Also increase `p-6` to `p-6 overflow-hidden` on the wrapper to ensure the rounded corners still clip properly while the inner rows have breathing room

