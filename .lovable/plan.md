

# Analytics Showcase Section

## Layout
- Two-column: **left = animated analytics card**, **right = text** (reversed from RecognitionDemo)
- Background: gradient from white to light purple (`#F5F3FF`) or similar
- Right text: "Analytics that show what's really happening" (Poppins, semibold, `#0F0D33`) + subtitle about recognition trends, engagement rates, participation gaps

## Animated Card (Left Column)
White rounded card with shadow, containing:
- **Header row**: metric title + 4 dot indicators (active dot = accent color pill, inactive = gray dots)
- **Big number** + trend badge (`+12%` with wave icon, green)
- **Department / Person toggle** (pill-style buttons, active has border)
- **Bar chart**: 5 bars with labels (Eng, Sales, Mktg, HR, Prod for Department; Sarah, Mike, Jess, David, Emily for Person)
- **Tooltip**: appears after bars animate, floats above one bar

## Animation Sequence (6 states, looping)
1. **Participation Rate + Department** -- purple bars grow in, tooltip appears on Sales: "94% Participation Rate"
2. **Participation Rate + Person** -- toggle flicks to Person, bars re-animate with new heights
3. **Recognitions Received + Person** -- dot indicator changes, pink/magenta bars, tooltip on Sarah: "45 Recognitions Received"
4. **Recognitions Sent + Department** -- cyan bars, toggle back to Department, tooltip on HR: "410 Recognitions Sent"
5. **Redemption Rate + Department** -- orange bars, tooltip on Mktg: "65% Redemption Rate"
6. Loop back to step 1

Each state: bars animate up (~600ms) → tooltip fades in (~400ms delay) → hold ~2.5s → transition to next

## Colors per metric
- Participation Rate: purple (`#8B7EC8` / `#B8ACE6`)
- Recognitions Received: magenta/pink (`#F572FF` / `#F9A8FF`)
- Recognitions Sent: cyan (`#5DE8E0` / `#9AF0EB`)
- Redemption Rate: orange (`#F5A623` / `#FCCF7E`)

## Changes

### 1. Create `src/components/AnalyticsShowcase.tsx`
- Self-contained animated component with hardcoded mock data for each metric state
- Uses Framer Motion for bar growth animations and tooltip fade-in
- Dot indicators, Department/Person toggle, bar chart, tooltip all rendered with divs (no Recharts)
- Auto-cycling with `useEffect` timers similar to RecognitionDemo pattern

### 2. Update `src/pages/Index.tsx`
- Import and add `<AnalyticsShowcase />` after `<BrandCatalogSection />`

