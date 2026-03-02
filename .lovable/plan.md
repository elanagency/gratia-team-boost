

## Fix ProblemStatement Heading — Still Wrapping to 3 Lines

The problem: on a ~1440px screen, the section's `md:px-[136px]` padding (272px total) limits the content area to ~1168px, which is less than `max-w-[1300px]`. At 48px bold Poppins, the first sentence still overflows that width.

### Change — `src/components/ProblemStatement.tsx`
Reduce the section's horizontal padding from `md:px-[136px]` to `md:px-[80px]` (line 24). This gives the heading ~1280px of horizontal space — enough for the first sentence on one line while still maintaining generous side padding.

| Line | Before | After |
|------|--------|-------|
| 24 | `md:px-[136px]` | `md:px-[80px]` |

The cards grid below will also get slightly wider, which is fine — they remain in a 2-column layout.

