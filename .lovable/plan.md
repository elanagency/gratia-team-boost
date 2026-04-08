

# Redesign Gift Card Redemption Modal to Match Figma

## Summary
Replace the current two-column grid layout (image left, form right) with a clean single-column modal matching the Figma specs exactly.

## Figma Design (from screenshots)
- Single-column layout, no side-by-side grid
- Title: "Redeem [Brand] Gift Card"
- Brand image in a container: `background: #F5F5F7`, `border-radius: 13.375px`, centered, ~height auto
- "Available Points" row: label left, points value right-aligned bold
- Centered label "Enter Amount or Enter Points" (`color: #9996AA`, `font-size: 13px`, `font-weight: 500`, `text-align: center`)
- Two side-by-side inputs: dollar input ("$ 0") and points input ("0 points") — both with `border-radius: 13.375px`, `border: 2px solid #E8E6F0`, `background: #F5F5F7`, `height: 43.75px`, `padding: 9.375px 15px`
- "Recipient Email" label
- Email input with same styling as above
- Helper text: "The gift link will be sent to this email address"
- Two buttons side-by-side:
  - **Cancel**: outline style, `border-radius: 13.375px`
  - **Confirm Redeem**: gradient `linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, `border-radius: 13.375px`, `padding: 9.375px 36.523px 9.375px 36.16px`
- Dialog container: `padding: 0 361.5px` on body content, `border-radius: 13.4px`

## Changes

### `src/components/team/GiftCardModal.tsx`
- Remove the `Card` wrapper and two-column grid
- Remove `RewardImage` and `RewardInfo` component usage
- Rebuild the modal content inline as a single-column form:
  1. Image container (centered brand logo with `#F5F5F7` bg, `13.375px` radius)
  2. Available Points row (flex, space-between)
  3. "Enter Amount or Enter Points" centered label
  4. Two side-by-side inputs: dollar amount (left) and points (right) — synced via exchange rate. When user types in dollar field, points auto-calculates and vice versa
  5. "Recipient Email" label + input + helper text
  6. Cancel + Confirm Redeem buttons
- Keep existing `handleRedeem` logic, recipient first/last name will use auth context values directly (no manual name fields — Figma doesn't show them)
- Dialog max-width reduced to ~`max-w-lg` to match Figma's narrower modal

### Input styling (shared)
```
border-radius: 13.375px
border: 2px solid #E8E6F0
background: #F5F5F7
height: 43.75px
padding: 9.375px 15px
font-size: 13px
```

### Button styling
- Cancel: outline, border `2px solid #E8E6F0`, border-radius `13.375px`
- Confirm Redeem: `background: linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, border-radius `13.375px`, opacity `0.5` when disabled

### Files modified
- `src/components/team/GiftCardModal.tsx`

