

## Adjust RecognitionDemo section to match Figma

### Changes in `src/components/RecognitionDemo.tsx`

1. **Widen the left text column**: The heading font-size from Figma is 36px with line-height ~111%. Currently using responsive sizes that end up too small. Set heading to `text-[36px]` with `leading-[111%]` and give the text container a max-width of ~569px so the title fits on 2 lines.

2. **Add gray background wrapper around the card**: The Figma shows the "Send Recognition" card sitting inside a larger gray container (`#F9FAFB`, `border-radius: 24px`, roughly 576×611px). Add an outer wrapper div with that background color and rounded corners around the existing white card.

3. **Increase section vertical padding**: Figma shows 96px top and bottom padding. Current is `py-24 md:py-32` — adjust to `py-24` (96px).

