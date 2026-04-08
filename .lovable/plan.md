

# Fix Leaderboard Sidebar Month Filter to Match Figma

## What changes

Update the month filter buttons in the Leaderboard fixed sub-sidebar to match the Figma specs exactly:

### Figma specs (from screenshots)
- **Remove** the "FILTER BY MONTH" header text entirely
- **Add calendar icon** (16x16, color #0F0533 for active, inherit for inactive) to the left of each month label
- **Active button**: background `#F5F5F7`, border-radius `13.375px`, text color `#0F0533`, font-weight `500`, font-size `14px`, line-height `21px`
- **Inactive button**: transparent background, text color `#9996AA`, font-weight `500`, font-size `14px`
- **Button layout**: `display: flex`, `align-items: center`, `gap: 9.375px`, padding `7.5px 122.375px 7.5px 11.25px` (effectively 7.5px vertical, 11.25px left, auto-stretch width)
- **Button height**: 36px fixed, full width (align-self: stretch)
- **Container gap**: 0 (buttons are flush, no gap between them)

### File modified
- `src/pages/admin/Leaderboard.tsx` — update the month filter section (lines 161-184)

### Details
1. Remove the "FILTER BY MONTH" `<p>` tag (line 161-163)
2. Replace pill-style purple active button with rounded-rect light gray (#F5F5F7) active style
3. Add `Calendar` icon import from lucide-react (16x16)
4. Update button styling to match Figma padding, border-radius 13.375px, font-size 14px

