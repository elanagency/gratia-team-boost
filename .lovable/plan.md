

## Refine AnalyticsShowcase bar chart to match Figma

### Current vs Figma differences

1. **Tooltip style**: Currently a colored pill with white text. Figma shows a light card with subtle border/shadow — name on first line (gray), bold number + metric label on second line (colored metric text).
2. **Tooltip content**: Currently single line like "94% Participation Rate". Figma shows two lines: "Sarah J." then "**45** Recognitions Received" (or "Sales" then "**94%** Participation Rate").
3. **Tooltip position**: Currently centered above bar. Figma shows it offset to the side, anchored near the bar top.
4. **Toggle styling**: Figma shows the active toggle with a subtle rounded-pill border, inactive is plain text — current implementation already close but the active state in Figma appears as a bordered pill (not colored background).

### Changes to `src/components/AnalyticsShowcase.tsx`

1. **Update STATES data** — split tooltip into `tooltipName` (e.g. "Sales", "Sarah J.") and `tooltipValue` + `tooltipLabel` (e.g. "94%", "Participation Rate")
2. **Restyle tooltip** — white background card with subtle shadow/border, two-line layout:
   - Line 1: name in gray text (small)
   - Line 2: bold value + colored metric label
   - Small caret/arrow pointing down
3. **Tooltip positioning** — keep above bar but left-aligned or offset to match Figma feel
4. **Toggle pills** — refine to use a light bordered pill for active state (border color matching the bar color), plain gray text for inactive

