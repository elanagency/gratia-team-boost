

# Pricing Section

## Layout
- `id="pricing"` for nav scroll targeting
- Background: light lavender gradient (`linear-gradient(180deg, #F5F3FF, #ffffff)`) with rounded border (`1px solid rgba(127,120,248,0.2)`), `border-radius: 24px`, subtle box-shadow
- Heading: "Transparent pricing, no surprises" (bold, `#0F0D33`)
- Subtitle: "One flat rate. No hidden fees. Ever.\nWhat you see here is exactly what you pay."
- Two-column layout below

## Left Column - Pricing Calculator Card
White card with rounded corners and shadow:
- **Company Size**: label + purple badge showing `{n} employees`
  - Slider: range 2-500, purple thumb, updates employee count
  - Below: "Platform access and 100 points per user per month" left, "$10 / seat per month" right (hardcoded from platform price)
- **Celebration Gift Value**: label + "Optional" badge + pink badge `${value} / event`
  - Slider: range $0-$100, pink thumb
  - Below: "Monthly cost based on your team's events" left, calculated `$X/mo` right
- Divider
- **Total Monthly Cost**: large bold `$X` calculated as `(employees * 10) + celebrationCost`
- "Platform, points, and celebrations." subtitle
- **"Get Started"** button (dark navy `#0F0D33`, rounded, links to `/signup`)

## Right Column - Everything Included
- Icon + bold heading "Everything included"
- 6 items with green check circles:
  1. 100 monthly points per user to give as recognition
  2. Zero redemption fees, always
  3. Automated birthday and anniversary celebrations
  4. Slack and Teams integration
  5. Real-time analytics
  6. Dedicated support
- Divider
- "More than 500 employees? Contact us for volume pricing." with pink link

## Calculation Logic
- Seat cost: `employees * 10` (hardcoded $10/seat for landing page)
- Celebration monthly estimate: simplified as `giftValue * (employees * avgEventsPerMonth / 12)` — or simpler: just `giftValue * Math.round(employees * 0.167)` (approx 2 events/employee/year)
- Total: seat cost + celebration estimate

## Changes

### 1. Create `src/components/PricingSection.tsx`
- Interactive slider-based pricing calculator
- "Everything included" feature list
- Responsive two-column layout

### 2. Update `src/pages/Index.tsx`
- Import and add `<PricingSection />` after `<CelebrationsSection />`

