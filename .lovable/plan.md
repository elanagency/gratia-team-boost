

## Fix FAQ Section Layout Shift

### Problem
When an accordion item expands, the FAQ section grows in height and pushes all content below it down the page.

### Solution
Set a fixed `min-height` on the FAQ section's content area so it always reserves enough space for an expanded accordion. The tallest category ("Pricing & Value" with 4 items, one expanded) needs roughly 700px. We'll apply this to the accordion container div.

### Changes — `src/components/FAQSection.tsx`

1. Add `min-h-[700px]` to the accordion wrapper `<div>` (line 138) so the section always reserves vertical space for expanded content, preventing layout shifts below.

