

# Fix Hero Card Vertical Centering & Text Specs

## Problem
The hero card has asymmetric padding (`24.5px` top, `2px` bottom) which offsets the content upward despite `alignItems: center`. The flex centering is fighting the unequal padding.

## Figma text specs (verified from screenshots)
- **Name**: Inter 20px, weight 600, line-height 30px, color #0F0533 — already correct
- **Department**: Inter 14px, weight 400, line-height 21px, color #9996AA — already correct  
- **Points**: Inter 18px, weight 600, line-height 27px, color #15803D — already correct

## Fix in `src/pages/admin/Leaderboard.tsx`

1. **Card padding**: Change from `"24.5px 24.5px 2px 24.5px"` to `"0 24.5px"` — let the fixed height (160.75px) and `alignItems: center` handle vertical centering naturally with equal space above and below the content.

### File modified
- `src/pages/admin/Leaderboard.tsx`

