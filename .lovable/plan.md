

## Fix ProblemStatement Heading — Reduce Font Size to Fit Two Lines

The core issue: "Your people appreciate each other more than you know." at 48px bold Poppins is simply too long for any reasonable container width. Even with `md:px-[80px]` and `max-w-[1300px]`, the first sentence alone exceeds the available space.

### Change — `src/components/ProblemStatement.tsx`

Reduce the desktop heading font size from `md:text-[48px]` to `md:text-[42px]` (line 31). At 42px bold Poppins, the first sentence fits comfortably on one line within ~1200px, and the `<br>` keeps the second sentence on line two.

| Line | Before | After |
|------|--------|-------|
| 31 | `md:text-[48px]` | `md:text-[42px]` |

The 42px size is still large and impactful — only a 12.5% reduction — and ensures the heading never wraps to three lines on standard desktop widths (1280px+).

