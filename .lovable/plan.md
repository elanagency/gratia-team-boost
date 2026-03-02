

## Fix Text Wrapping Across Landing Page Sections

Three sections have text that wraps onto more lines than the Figma design intends. The root causes are a combination of container width constraints and font sizing.

### 1. Problem Statement heading — `src/components/ProblemStatement.tsx`
- The heading "Your people appreciate each other more than you know. The problem is, that appreciation is invisible." wraps onto 3 lines but should be 2.
- Current container is `max-w-6xl` (72rem / 1152px). The Figma shows a wider heading area.
- **Fix**: Change the heading's max-width constraint. The heading text block itself needs a wider container — bump to `max-w-7xl` for the text area, or remove the max-width on the heading section and let the outer `max-w-6xl` handle it. Looking at the Figma, the heading spans nearly the full width. Change the text container from `max-w-6xl` to `max-w-7xl`.

### 2. Slack Feed Section body text — `src/components/SlackFeedSection.tsx`
- Body text "When someone gets recognized in Grattia, it shows up directly in your Slack or Microsoft Teams channels. The whole team can celebrate together, right where conversations already happen." is on 4 lines but should be 3.
- Current font size is `text-lg md:text-xl` which renders at 20px on desktop. Figma specifies 18px / weight 400.
- **Fix**: Change `text-lg md:text-xl` to `text-lg` (18px) on the body paragraph (line 108).

### 3. Brand Catalog Section body text — `src/components/BrandCatalogSection.tsx`
- Body text "Every recognition received comes with points. Redeem them from 300+ gift card options across top brands, instantly." is on 3 lines but should be 2.
- Same issue: `text-lg md:text-xl` renders at 20px. Figma is 18px.
- **Fix**: Change `text-lg md:text-xl` to `text-lg` on the body paragraph (line 65).

### Summary of changes
| File | Line | Change |
|------|------|--------|
| `ProblemStatement.tsx` | ~37 | `max-w-6xl` → `max-w-7xl` on the text container div |
| `SlackFeedSection.tsx` | ~108 | `text-lg md:text-xl` → `text-lg` on body `<p>` |
| `BrandCatalogSection.tsx` | ~65 | `text-lg md:text-xl` → `text-lg` on body `<p>` |

