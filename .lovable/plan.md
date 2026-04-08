

# Refine Team Members Table to Match Figma Specs

## Problem
The table is embedded directly inside `TeamManagementCard` without structural separation. The table styles don't match Figma specs for typography, spacing, colors, and the role badge treatment. The table needs to be visually separated as its own bordered component within the outer card.

## Figma Specs Extracted from Screenshots

### Outer card (TeamManagementCard)
- No outer border — the card is borderless; the table itself has its own border
- Title: Inter 15px, weight 600, color #0F0533, line-height 22.5px
- Subtitle: Inter 13px, weight 400, color #9996AA, line-height 19.5px
- Search input: height 38px, border-radius 13.375px, border 1px solid #E8E6F0, bg #F5F5F7, placeholder Inter 14px weight 400 color rgba(15,5,51,0.5)
- Invite button: gradient background `linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, border-radius 13.375px, padding 8.5px 15px 6px 15px

### Table (separate component with own border)
- Container: border-radius 13.375px, border 1px solid #E8E6F0, background #F5F5F7
- Header row: height 38px, padding 7.5px 11.25px, bg #F5F5F7, border-radius top 13.375px
- Header text: Inter 11px, weight 500, color #9996AA, uppercase, letter-spacing 0.44px, line-height 16.5px
- Row name: Inter 13px, weight 500, color #0F0533, line-height 19.5px
- Row subtitle: Inter 11px, weight 400, color #9996AA, line-height 16.5px
- Row email/department/dates: Inter 13px, weight 400, color #6B6B80
- Role badge: border-radius 13.375px, gradient bg `linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, padding ~8.5px 13.8px 6px 15px. Admin variant: different color (orange/amber gradient)
- Row border: 1px solid #F3F2F7
- Pagination: "Showing 1-10 of 20" text left-aligned, page numbers right-aligned with `<` `1` `2` `>` controls

## Changes

### `src/components/settings/TeamManagementCard.tsx`
- Remove outer card border — the wrapper becomes borderless (just padding)
- Update search input: bg to `#F5F5F7`, placeholder color to `rgba(15,5,51,0.5)`, font-size 14px
- Remove Departments/Slack Import/CSV buttons from header (keep them but move to be less prominent, or keep as-is per feature preservation principle)
- Update Invite button: gradient background `linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, `+ Invite` label

### `src/components/team/TeamMemberTable.tsx`
- Wrap table in its own container with border-radius 13.375px, border 1px solid #E8E6F0
- Header row: bg #F5F5F7, height 38px, padding 7.5px 11.25px, border-radius top corners
- Header text: 11px, weight 500, color #9996AA, uppercase, letter-spacing 0.44px
- Name: 13px weight 500, color #0F0533
- Subtitle: 11px weight 400, color #9996AA
- Role badge: gradient pill with white text instead of plain purple text. Admin gets a different style.
- Pagination: bottom of the table container, showing "Showing X-Y of Z" left and page controls right

### Files modified
- `src/components/settings/TeamManagementCard.tsx`
- `src/components/team/TeamMemberTable.tsx`

