

# Celebrations Section

## Layout
- Two-column: **left = animated celebration card**, **right = text**
- Background: white
- Right text: "Birthdays and anniversaries, handled automatically" (Poppins, semibold, `#0F0D33`) + subtitle "Grattia remembers every milestone. Consistent, small moments add up to a culture where people feel valued."

## Left Column - Celebration Card
Light gray rounded container holding a white card with:
- **Avatar**: circular illustration placeholder (use a gradient circle with initials "P" as fallback)
- **Confetti**: animated colorful dots/shapes (pink, blue, yellow, orange, green) that drop/float down around the avatar
- **Text**: "Happy Birthday Pedro!" (bold) + "Here's a little something to celebrate you."
- **Button**: dark navy rounded button "Redeem a $25 gift card"

## Confetti Animation
- ~15-20 small colored shapes (circles, squares, diamonds) positioned around the card
- On scroll into view: confetti particles fall/float downward with slight horizontal drift using Framer Motion
- Each particle has randomized: color, size (4-8px), start position, delay, duration, rotation
- Subtle continuous float after initial drop

## Changes

### 1. Create `src/components/CelebrationsSection.tsx`
- Two-column layout with celebration card and confetti animation
- Confetti particles generated with randomized properties, animated with Framer Motion `whileInView`
- Card with avatar circle, heading, subtitle, and CTA button

### 2. Update `src/pages/Index.tsx`
- Import and add `<CelebrationsSection />` after `<ReviewCyclesSection />`

