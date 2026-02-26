

# Remove Old Sections Below RecognitionDemo

Remove Features, HowItWorks, Pricing, CTA, and their dark wrapper from Index.tsx. Keep Header, Hero, ProblemStatement, TheSolution, RecognitionDemo, and Footer.

## Changes

1. **`src/pages/Index.tsx`** — Remove imports for Features, HowItWorks, Pricing, CTA and remove the dark `<div>` block containing them. Keep Footer.

2. **Delete files** (no longer needed):
   - `src/components/Features.tsx`
   - `src/components/HowItWorks.tsx`
   - `src/components/Pricing.tsx`
   - `src/components/CTA.tsx`
   - `src/components/SlackIntegration.tsx`

