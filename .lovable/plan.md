

## Recognition Feed Header Fixes

### Changes to `src/components/points/RecognitionFeed.tsx`

**1. Add horizontal divider below the header row**
- After the header `<div>` containing "Recognition Feed" and the tabs (line 541), add a `<Separator />` or `<div className="border-t border-border" />` to create the line breaker shown in Figma.

**2. Wrap tabs in a gray pill container**
- Wrap the three `<TabButton>` elements (line 536) in a container with a gray background pill: `bg-muted rounded-lg p-0.5` (matching Figma's grouped tab bar style with `border-radius: 7.375px` ≈ `rounded-lg`).

**3. Fix active tab corner radius**
- The active tab currently uses `rounded-full` (fully rounded). Per Figma, the active tab background (`#0F0533`) should use `rounded-[7px]` to match the container's inner radius, not fully rounded. Update the TabButton's active class from `rounded-full` to `rounded-[7px]`.
- Inactive tabs should also use `rounded-[7px]` for consistency.

### Files to modify
1. `src/components/points/RecognitionFeed.tsx` — tab container styling, active tab radius, separator after header

