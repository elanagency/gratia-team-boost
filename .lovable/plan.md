

# New "Problem Statement" Section

This is a new section between the Hero and the dark Features/HowItWorks block. It doesn't exist yet.

## Design (from Figma)

- White background, centered text
- **Heading**: "Your people appreciate each other more than you know. The problem is, that appreciation is invisible." — Poppins, 48px, weight 700, line-height 125%, color `#0F0D33`, centered
- **Subtitle**: "Grattia brings it to the surface — in real time, across your whole company." — Poppins, 20px, weight 400, line-height 140%, color `#4A5565`, centered
- **2x2 card grid** with 4 cards, each with:
  - Padding 32px, gap 16px between title and body, border 1px rounded ~16px, white bg with subtle border
  - Title: Poppins, 24px, weight 700, line-height 133%, color `#0F0D33`, letter-spacing -0.6px
  - Body: normal weight, color `#4A5565`

### Cards content:
1. **The Quiet Contributor** — "Your hardest workers are often your least visible ones. They deserve to be seen just as much as anyone else."
2. **The Silo Problem** — "Teams naturally celebrate their own, but the people who bridge departments and drive collaboration rarely get the credit they've earned."
3. **Invisible Work** — "The late nights, the saved projects, the teammate who always shows up. None of it shows up in a report."
4. **The Memory Trap** — "Reviews are based on what managers remember from last week, not last year."

## Changes

1. **Create `src/components/ProblemStatement.tsx`** — New component with the heading, subtitle, and 2x2 card grid as described above.
2. **Update `src/pages/Index.tsx`** — Import and place `<ProblemStatement />` between `<Hero />` and the dark section div.

