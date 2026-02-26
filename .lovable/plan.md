

# Review Cycles Section

## Layout
- Two-column: **left = text**, **right = animated review card**
- Background: white/light
- Left: heading "Review cycles that don't start from scratch" + subtitle "With every recognition logged, performance reviews stop being a memory test. Managers are prepared, and employees feel seen."

## Right Column - Review Card
White rounded card with shadow containing:
- **Header**: person icon + "Elvin Acevedo's Review"
- **3 recognition entries**, each in a light gray rounded card:
  1. Pink dot + **Alex Chen** / Jan 26, 2026 / "Elvin went above and beyond to help the new interns get settled. Her patience and..."
  2. Pink dot + **Emily Rodriguez** / Jan 16, 2026 / "Thank you for organizing the team building event! It was exactly what we..."
  3. Green dot + **Shomari Love** / Dec 16, 2025 / "Incredible work on the Q3 financial report. Your attention to detail saved us weeks of..."

## Animation
- Cards fade/slide in sequentially from bottom with stagger delay using Framer Motion
- Subtle entrance when section scrolls into view (whileInView)

## Changes

### 1. Create `src/components/ReviewCyclesSection.tsx`
- Static two-column layout with hardcoded review data
- Framer Motion staggered entrance animations on scroll

### 2. Update `src/pages/Index.tsx`
- Import and add `<ReviewCyclesSection />` after `<AnalyticsShowcase />`

