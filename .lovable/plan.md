

# Hero Section Refinements

## Issues from Figma

1. **"Get Started" button gradient**: Currently `from-[#FC36FF] to-[#7A1BF7]` (missing blue/teal). Should match the Sign Up button: `from-[#FC36FF] via-[#7F78F8] to-[#71F8F7]`.

2. **"Book a Demo" button border**: Currently `border-2` (thick). Figma shows a thin border — should be `border` (1px).

3. **Spacing**: Figma shows section padding of `192px` top, `135.5px` left/right, and the section height is `1220px`. The subtitle is Poppins 20px, weight 500, color `#9996AA`, line-height 162.5%. Current spacing uses generic Tailwind classes that don't match.

4. **Subtitle text**: Current copy doesn't match Figma. Should be: "Grattia helps your team feel seen every day, while giving HR and leadership the real-time data to build a culture people want to stay in."

## Changes to `src/components/Hero.tsx`

- **Section padding**: Change from `px-4 py-20 pt-32` to approximately `pt-48 pb-36 px-[136px]` (with responsive fallbacks) to match the 192px top padding and 135.5px side padding.
- **"Get Started" button**: Update gradient to `from-[#FC36FF] via-[#7F78F8] to-[#71F8F7]` (matching Sign Up).
- **"Book a Demo" button**: Change `border-2` to `border` for a thin 1px border.
- **Subtitle**: Update copy to match Figma text. Update classes to `text-[20px] font-medium leading-[162.5%] text-[#9996AA]` with Poppins font.
- **Max width for subtitle**: Set to `max-w-[570px]` per Figma (570px fixed width).

