

# Fix Team Members Page: Button Colors, Pill Styles & Container

## Problems
1. **Invite button** uses flat `#F572FF` — should be `linear-gradient(135deg, #7F2BFE, #FC5BFF)` with border-radius `13.375px` and padding `8.5px 13.836px 6px 15px`
2. **Role pills** — from Figma the pill container uses `linear-gradient(135deg, #7F2BFE, #FC5BFF)` background, white text, padding `8.5px 13.836px 6px 15px`, border-radius `13.375px`. Admin pill uses `#FC5BFF` text color (not gradient). Need to verify current rendering matches Figma exactly
3. **Missing outer container** — Company section has a `border: 1px solid #E8E6F0, border-radius: 15px, padding: 15px` wrapper. Team Members section needs the same.

## Changes

### `src/components/team/TeamInviteManager.tsx`
- Replace `className="bg-[#F572FF] hover:bg-[#E061EE] text-white"` with inline style: `background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)"`, `color: "#fff"`, `borderRadius: 13.375`, `padding: "8.5px 13.836px 6px 15px"`, `fontFamily: "Inter, sans-serif"`, `fontSize: 13`, `fontWeight: 500`
- Change icon from `PlusCircle` to `Plus` and update label to `+ Invite`

### `src/components/settings/TeamManagementCard.tsx`
- Wrap the entire content `<div>` in an outer container with `border: "1px solid #E8E6F0"`, `borderRadius: 15`, `padding: 15`, matching the Company card wrapper

### `src/components/team/TeamMemberTable.tsx`
- Update role pill padding from `3px 12px` to `8.5px 13.836px 6px 15px` to match Figma exactly
- Admin pill: keep separate gradient (`linear-gradient(135deg, #F59E0B, #F97316)`) or update to match Figma if Admin uses `#FC5BFF` text — from screenshots, Admin text color is `#FC5BFF` on gradient bg, Member text color is `#7F2BFE` on gradient bg. Both pills use the same gradient background.

### Files modified
- `src/components/team/TeamInviteManager.tsx`
- `src/components/settings/TeamManagementCard.tsx`
- `src/components/team/TeamMemberTable.tsx`

