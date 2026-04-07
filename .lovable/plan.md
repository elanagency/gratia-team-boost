

## Redesign Upcoming Celebrations to Match Figma

### Figma Specs

**Container**: `rounded-[13.375px]`, `border 1px solid #E8E6F0`, no shadow, `bg-white`. Outer container: `display: flex`, `flex-direction: column`, `height: 153px` (content area), `padding: 11.25px 15px 0 15px`, `gap: 11.25px`.

**Header row**: Height ~44.5px, padding `0 15px`, `border-bottom: 1px solid #E8E6F0`, flex with `justify-content: space-between`, `align-items: center`.
- "Upcoming Celebrations" — Inter, 14px, weight 600, color `#0F0533`, line-height 21px

**Each celebration row**: Flex, padding `0 15px`, `align-items: center`, `border-bottom: 1px solid #E8E6F0` (except last).
- **Emoji**: ~37px area, showing 🎂 for birthday, 🎉 for work anniversary (matching Figma exactly)
- **Name**: Inter, 13px, weight 500, color `#0F0533`, line-height 19.5px
- **Type label**: Inter, 11px, weight 400, color `#9996AA`, line-height 16.5px — "Birthday" or "Work Anniversary"
- **Date**: Inter, 12px, weight 400, color `#9996AA`, line-height 18px, right-aligned — format "Mar 18"

**Limit**: Show only top 3 (not 5).

### Changes to `src/components/dashboard/UpcomingCelebrations.tsx`

1. Replace `Card`/`CardHeader`/`CardContent` with custom `div` matching leaderboard pattern (`rounded-[13.375px] border border-[#E8E6F0] bg-white overflow-hidden`)
2. Header: "Upcoming Celebrations" with exact typography specs
3. Rows: emoji (text, not icon component), name, type label, date — all with inline Inter styles
4. Change `.slice(0, 5)` to `.slice(0, 3)`
5. Remove Cake/Briefcase lucide imports, use emoji characters instead
6. Remove "daysUntil" display logic — just show date as "Mar 18" format
7. Remove colored circle backgrounds around icons

### File to modify
1. `src/components/dashboard/UpcomingCelebrations.tsx`

