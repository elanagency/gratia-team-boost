
Goal
- Make the area behind and around the Pricing section pure white.

Implementation steps
1. Update `src/components/PricingSection.tsx`:
   - Add `bg-white` to the outer `<section id="pricing" ...>` class so the section’s full-width area (including vertical spacing and side gutters) is white.
2. Keep the pricing card design intact:
   - Preserve the inner card gradient (`linear-gradient(180deg, #F5F3FF, #ffffff)`), border, and shadow exactly as-is.
3. Fallback only if any gray still appears:
   - Update `src/pages/Index.tsx` root wrapper to `className="min-h-screen bg-white"` so landing page background is forced to white without touching dashboard pages.

Technical details
- Primary file: `src/components/PricingSection.tsx`
- Optional fallback file: `src/pages/Index.tsx`
- Scope: styling-only change (no content, spacing structure, or logic updates)
- Validation: scroll around the Pricing transition area and confirm no light-gray strip remains.
