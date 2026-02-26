

# Header Refinements

## Issues to Fix

1. **Not floating**: Currently `fixed top-0 left-0 right-0` with `border-b` — should be a floating bar with rounded corners, inset from edges, with a box-shadow underneath (like the Figma: `box-shadow: 0 10px 15px -3px rgba(0,...)`, `border-radius: 1677200px` i.e. fully rounded, `border: 1px solid rgba(255,255,255,0.2)`, `background: rgba(255,255,255,0.4)`)

2. **Button gradient missing blues**: Current gradient is `from-[#FC36FF] to-[#7A1BF7]` (pink to purple). Figma shows a gradient that goes from pink (#FC36FF) through purple (#7F78F8) to cyan/blue (#71F8F7) ending in white (#FFFFFF) — a multi-stop gradient with visible blue/teal tones.

## Changes

### `src/components/Header.tsx`

- **Floating container**: Replace `fixed top-0 left-0 right-0 bg-white border-b border-gray-100` with a wrapper that has padding from edges, and an inner bar with:
  - `bg-white/40` (semi-transparent white)
  - `backdrop-blur-md`
  - `rounded-full` (pill shape)
  - `border border-white/20`
  - `shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]`
  - Margin from top/sides (~`mt-6 mx-8`)

- **Sign Up button gradient**: Change to `bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7]` to include the blue/teal stops visible in Figma.

