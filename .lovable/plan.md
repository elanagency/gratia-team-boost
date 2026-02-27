

## Expand "The Solution" gradient background

### Change in `src/components/TheSolution.tsx`

The gradient background currently transitions too quickly (white → #F5F3FF at 40%, back to white at 60%), making it appear as a thin band. Expand it to cover the full section by changing the gradient stops to start earlier and end later — e.g., white at 0%, #F5F3FF from 10% to 90%, white at 100%. Also increase vertical padding to give the section more breathing room, matching the Figma's spacious feel.

