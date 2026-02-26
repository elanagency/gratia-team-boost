

## Add Final CTA Section Before Footer

The Figma shows a large centered call-to-action section between the FAQ and the Footer. It needs to be created as a new component.

### 1. Create `src/components/FinalCTA.tsx`
- White background, generous vertical padding (~py-32)
- Centered bold heading: "Your people are doing great work right now." in dark navy (#0F0D33), large size (~text-5xl/text-6xl), font-weight bold
- Two lines of subtext in lighter color:
  - "Someone stayed late. Someone saved a project. None of that was recognized today."
  - "Grattia makes sure it stops slipping by."
- Two buttons side by side:
  - "Get Started" — solid dark navy (#0F0D33) pill button, white text
  - "Book a Demo" — outlined pill button with dark border
- Link "Get Started" to `/signup`

### 2. Update `src/pages/Index.tsx`
- Import and add `<FinalCTA />` between `<FAQSection />` and `<Footer />`

