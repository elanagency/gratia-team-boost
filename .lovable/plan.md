

# Update Celebrations Section to match Figma design

## Changes needed

Comparing the Figma reference to the current implementation:

1. **Use memoji avatar image** instead of the gradient circle with "P" letter
2. **Larger card container** — Figma shows a wider card area with more padding, background is a subtle light blue-grey (`#F5F7FA` or similar) instead of `#F3F4F6`
3. **Confetti scattered around the avatar** — particles should originate from around the avatar area, not fall from the top
4. **Button styling** — remove the `Gift` icon, use a wider rounded-lg (not fully round) dark button matching the Figma
5. **Section background** — Figma shows a subtle fade from light blue to white underneath the section

## Implementation steps

### 1. Copy the memoji image to project assets
- Copy `user-uploads://e53f48be-18d4-40e8-bff0-0ea477bab363.png` → `src/assets/pedro-memoji.png`

### 2. Update `src/components/CelebrationsSection.tsx`
- Import the memoji image
- Replace the gradient circle avatar (lines 94-101) with an `<img>` tag using the memoji, sized ~120px, no background circle
- Remove the `Gift` icon import
- Update button: remove `Gift` icon, use `rounded-lg` instead of `rounded-full`, make it wider with more padding
- Adjust confetti particles to scatter around the avatar center rather than falling from top — change initial positions to radiate outward from the avatar area
- Update outer card container: increase `max-w` to ~420px, change background to `#F0F4FA`
- Add section background gradient: fade from `#F0F4FA` to white

