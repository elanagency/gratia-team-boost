

## Remove brands without logos from BrandCatalogSection

### Change in `src/components/BrandCatalogSection.tsx`

- Remove `starbucksLogo` import
- Remove `BRANDS_ROW2` entirely (all text-only brands)
- Update `BRANDS_ROW1` to only contain: Nike, Visa, Amazon, Apple, Nordstrom, Airbnb (remove Starbucks and Target)
- Remove the second `<MarqueeRow>` call, keep only one row

