

## Match heading font size across all sections to RecognitionDemo

The RecognitionDemo heading uses `text-[36px] leading-[1.3]` which looks correct. The other four sections use `text-3xl md:text-4xl lg:text-[44px] leading-[1.3]` — the `leading-[1.3]` is the same but the font size is larger (44px at desktop), producing different visual spacing.

### Changes

Update the heading class in these four files from `text-3xl md:text-4xl lg:text-[44px]` to `text-[36px]`:

1. **`src/components/SlackFeedSection.tsx`** line 115
2. **`src/components/AnalyticsShowcase.tsx`** line 255
3. **`src/components/ReviewCyclesSection.tsx`** line 38
4. **`src/components/BrandCatalogSection.tsx`** line 62

All will become `text-[36px] leading-[1.3] font-semibold` — identical to RecognitionDemo.

