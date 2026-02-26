

# Remove grey background from FAQ section

## Change in `src/components/FAQSection.tsx`

The section already has `bg-white` class. Need to check if there's a parent wrapper or if the issue is the overall page background (`bg-[#f7f8fa]` on body). The FAQ section itself should be fine with `bg-white`, but let me verify the current state of the file.

Looking at the screenshot, the FAQ section appears to be sitting on the page's default `#f7f8fa` background. The section already has `bg-white` in the code. The issue might be that the pricing section above has a colored background that's making the transition visible, or the FAQ section's `bg-white` is not taking effect.

Let me check the current file state.

