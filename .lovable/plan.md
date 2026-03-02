

## Fix ProblemStatement Heading Width

The heading is wrapping to 3 lines because `max-w-7xl` (80rem/1280px) still isn't wide enough at the current 48px font size with the section's horizontal padding.

### Change — `src/components/ProblemStatement.tsx`
- Remove the `max-w-7xl` constraint on the text container (line 25) and replace with a wider value. Since the section already has `md:px-[136px]` padding, the content area is naturally constrained. Change `max-w-7xl` to a custom max-width like `max-w-[1300px]` which should give enough room for the first sentence to fit on one line while still being bounded.

| Line | Before | After |
|------|--------|-------|
| 25 | `max-w-7xl` | `max-w-[1300px]` |

This keeps the responsive behavior intact — on smaller screens the padding collapses and text will naturally wrap as needed.

