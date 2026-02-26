

# Rewards Catalog Section

## Layout
- White background, two-column layout: left = text, right = brand logo grid card
- Same layout direction as RecognitionDemo (text left, visual right)
- Heading: "A rewards catalog employees actually want" -- Poppins, font-semibold, `#0F0D33`
- Subtitle: "Every recognition received comes with points. Redeem them from 300+ gift card options across top brands, instantly." -- `rgba(15, 13, 51, 0.7)`

## Right Column -- Brand Logo Card
- Large rounded card with light gray background (`#F5F5F7` or similar)
- Two rows of 3 brand logos each, displayed in individual white rounded cards with subtle border
- **Top row scrolls left-to-right**, **bottom row scrolls right-to-left** (opposite directions)
- Horizontal marquee-style infinite scroll using CSS animation (similar technique to the Slack vertical scroll)
- Container has `overflow: hidden` to clip the scrolling logos
- Brands to display (repeating for seamless loop): Nike, Visa, Amazon, Apple, Nordstrom, Airbnb, plus a few more for variety (Starbucks, Target, etc.)
- Brand logos rendered as text-based representations (styled brand names) since we don't have actual logo image files

## Animation
- Two new CSS keyframes in tailwind.config.ts: `scroll-left` and `scroll-right`
- Each row contains doubled brand items for seamless looping
- Slow speed (~25-30s per cycle)

## Changes

### 1. Create `src/components/BrandCatalogSection.tsx`
- Two-column section with Framer Motion fade-in
- Left: heading + subtitle
- Right: gray rounded card containing two animated rows of brand logo cards scrolling in opposite directions

### 2. Update `tailwind.config.ts`
- Add `scroll-left` and `scroll-right` keyframes and animations

### 3. Update `src/pages/Index.tsx`
- Add `<BrandCatalogSection />` after `<SlackFeedSection />`

