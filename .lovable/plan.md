

# New "The Solution" Transition Section

## Design from Figma

- **Background gradient**: Fades from white (`#FFFFFF`) at top to light purple (`#F5F3FF`) — creating a smooth transition before the dark sections
- **"The Solution" pill badge**: Centered, with a sparkle/asterisk icon, rounded-full, border `#FFFFFF40`, background `#FFFFFF20`, shadow that pulsates (grows outward then fades, repeating)
- **Heading**: "Make recognition a daily habit, not an annual obligation." — Poppins, ~48px bold, `#0F0D33`, centered
- **Subtitle**: "Empower your team to celebrate wins instantly. Turn moments into actionable data and see your culture in real-time." — ~20px, `#0F0D33` at 80% opacity, centered
- **Padding**: 96px top, large horizontal padding (~328px), centered content
- Substantial vertical whitespace below the subtitle

## Changes

1. **Create `src/components/TheSolution.tsx`** — New component with:
   - `bg-gradient-to-b from-white to-[#F5F3FF]` background
   - Centered pill badge with sparkle icon and a CSS `@keyframes` pulsating box-shadow animation
   - Heading and subtitle as described
   - Generous vertical padding (~96px top, large bottom)

2. **Update `src/pages/Index.tsx`** — Insert `<TheSolution />` between `<ProblemStatement />` and the dark `<div>` block (replacing the hard white-to-dark transition with this smooth fade)

