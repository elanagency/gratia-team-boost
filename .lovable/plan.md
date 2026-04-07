

## Right Panel and Your Stats Redesign

### 1. Widen and fix the right panel (`UnifiedDashboardLayout.tsx`)

**Current**: `w-[300px]`, `sticky top-0`, with `p-6 pt-[72px]`

**Changes**:
- Increase width from `w-[300px] min-w-[300px]` to `w-[350px] min-w-[350px]` (closer to Figma's ~301px content + 16px padding each side)
- Change from `sticky top-0` to true fixed positioning: remove from flex flow, use `fixed right-0 top-0 h-screen` so it floats like the left sidebar
- Add corresponding `mr-[350px]` or `pr-[350px]` to the main content area so it doesn't overlap
- Reduce center padding from `lg:px-[145px]` to something smaller (e.g. `lg:px-[60px]`) since the wider right panel eats into available space
- Keep `border-l border-[#E8E6F0]`, `overflow-y-auto`, `p-4 pt-[72px]`, `gap-6`

### 2. Redesign PersonalStatsCard to match Figma (`PersonalStatsCard.tsx`)

**Figma specs observed**:
- Card has `border-radius: 13.375px`, `border: 1px solid #E8E6F0`, subtle gradient background (`linear-gradient(135deg, #7F2BFE 6%, #FC5BFF 6%)` at very low opacity)
- Padding: 16px all sides, gap 15px between elements
- Top section: user avatar (small) + name + role/title, left-aligned
- Below: three stats in a row — "1,680 Points", "30 Received", "45 Sent"
  - Numbers: Inter font, 18px, weight 600, color #0F0533, centered
  - Labels: Inter font, 14px, weight 600, color #0F0533, centered
- No icons above the numbers (unlike current design with Award/Arrow icons)
- No "Your Stats" header title — the card is self-explanatory with user info at top

**Rebuild the component**:
- Remove the Card/CardHeader/CardTitle wrapper; use a plain `div` with `rounded-[13.375px] border border-[#E8E6F0] p-4`
- Add subtle gradient background matching Figma
- Top row: avatar + user name + role (from auth context — `firstName lastName`, role/title if available)
- Stats row: three equal columns, each showing the number (18px, font-semibold, #0F0533) and label below (14px, font-semibold, #0F0533)
- Use Inter font via inline style
- Labels: "Points", "Received", "Sent" (no icons)

### Files to modify
1. **`src/pages/dashboard/UnifiedDashboardLayout.tsx`** — widen right panel, make it fixed, adjust center content offset
2. **`src/components/dashboard/PersonalStatsCard.tsx`** — full redesign to match Figma layout with user info + 3-column stats

