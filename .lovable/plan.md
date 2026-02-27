

## Fix Brand Catalog gray box height & icon sizes + heading line-height across all sections

### 1. `src/components/BrandCatalogSection.tsx` — Taller gray box & bigger brand logos

- Increase the gray wrapper padding from `p-6` to `p-10` and add more vertical gap (`gap-6`) to make the box taller
- Increase brand card dimensions from `w-[140px] h-[80px]` to `w-[160px] h-[100px]`
- Increase logo max dimensions from `max-h-[36px] max-w-[90px]` to `max-h-[48px] max-w-[110px]`
- Change background to `#F9FAFB` and border-radius to `rounded-[24px]` for consistency with other sections

### 2. Heading line-height fix across all feature sections

The Figma uses a more generous line-height on headings. Currently most sections use `leading-tight` (1.25) or `leading-[111%]`. Update all section headings to use `leading-[1.3]` (~130%) for better spacing between lines:

- **`src/components/BrandCatalogSection.tsx`** line 62 — `leading-tight` → `leading-[1.3]`
- **`src/components/SlackFeedSection.tsx`** line 115 — `leading-tight` → `leading-[1.3]`
- **`src/components/AnalyticsShowcase.tsx`** line 255 — `leading-tight` → `leading-[1.3]`
- **`src/components/ReviewCyclesSection.tsx`** line 38 — `leading-tight` → `leading-[1.3]`
- **`src/components/RecognitionDemo.tsx`** line 75 — `leading-[111%]` → `leading-[1.3]`

