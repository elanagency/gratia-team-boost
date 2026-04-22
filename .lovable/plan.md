

# Redemption Modal — Match Figma Specs

## Goal
Restructure `GiftCardModal` to match the screenshots: wider rectangular dialog, header with bottom divider, white logo box with thin border, gray "Available Points" pill, divider above the action row, and exact typography.

## Spec changes (from Figma inspector)

### Dialog
- Width: wider/more rectangular — `max-width` ~520px (current `max-w-lg` ≈ 512 is fine, but switch padding so the content feels less cramped). Remove the single outer `padding: 24px 28px` wrapper and use distinct sections so we can put **dividers spanning edge-to-edge**.

### Header section
- Padding: `0 18.75px`, height ~66px, `display: flex`, `justify-content: space-between`, `align-items: center`
- **`border-bottom: 1px solid #E8E6F0`** (full-width thin line under header)
- Title font unchanged (Inter 16/600, `#0F0533`)
- Built-in `<DialogPrimitive.Close>` button already provides the `×` — keep it; remove our own padding wrapper around the title so the close icon aligns at top-right of the header row.

### Brand image box
- `background: #FFFFFF` (NOT gray)
- `border: 1px solid #E8E6F0`
- `border-radius: 13.375px`
- `height: 122px`, centered logo
- Outer section padding: `18.75px` horizontal, `18.75px` top from header

### Available Points pill
- `background: #F5F5F7`
- `border-radius: 13.375px`
- `height: 46.5px`
- `padding: 11.25px 15px`
- Label "Available Points": Inter, **13px / 400**, `#9996AA`, line-height 19.5px
- Value "1,680": Inter, **16px / 600**, `#0F0533`, line-height 24px
- Layout: flex space-between, align-items center

### Enter Amount label + inputs
- Keep current label and the two inputs (dollar / points) — user confirmed these are fine.

### Recipient Email + helper
- Keep current input and helper text.

### Divider above buttons
- Add `<hr style={{ border: 0, borderTop: '1px solid #E8E6F0', margin: '18.75px -18.75px 18.75px' }} />` so the line spans edge-to-edge of the dialog.

### Action row
- Cancel + Confirm Redeem buttons unchanged styling, taller (~46px) to match screenshot proportions.

## Structural change in JSX
Replace the single `<div style={{ padding: '24px 28px' }}>` wrapper with three sections:
1. **Header** — own padding `18.75px`, bottom border.
2. **Body** — padding `18.75px`, contains brand box, points pill, amount inputs, email field + helper.
3. **Footer** — top border, padding `18.75px`, contains Cancel + Confirm buttons.

This way the two divider lines naturally span the full dialog width without negative margin hacks.

## File modified
- `src/components/team/GiftCardModal.tsx`

