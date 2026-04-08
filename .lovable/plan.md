

# Perfect the Leaderboard Hero Card and Content Layout

## Changes to `src/pages/admin/Leaderboard.tsx`

### 1. Remove the selected month subtitle
Delete the `<p>` showing "April 2026" at the top of the content area (lines 200-203).

### 2. Add a divider between sidebar months and content, with 30px spacing
In the sidebar, after the month buttons, no change needed — the border-right already separates. But the content area top padding needs adjusting so the hero card aligns with the "Leaderboard" title vertically. The content area should have `paddingTop: 22.5px` (matching sidebar) with no subtitle, going straight into the hero card.

### 3. Hero card — match Figma specs pixel-for-pixel

From the screenshots:

**Hero card container:**
- `border-radius: 15px`
- `border: 2px solid #7F2BFE`
- `background: linear-gradient(135deg, rgba(127,43,254,0.08) 0%, rgba(252,91,255,0.08) 100%)`
- `padding: 24.5px 24.5px 2px 24.5px` (top/left/right: 24.5px, bottom: smaller)
- `height: 160.75px`
- `display: flex`, `flex-direction: column`, `align-items: flex-start`
- `gap: 30px` between content sections

**Avatar container:**
- `width: 37.5px`, `height: 37.5px` (the rank badge container overlaying the avatar)
- Avatar itself appears ~75px based on layout — actually from screenshot the avatar is about 75px with a 37.5px rank badge overlay
- Rank badge: `width: 37.5px`, `height: 37.5px`, fully round, `background: linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, positioned bottom-left of avatar

**Name text:**
- `font-size: 20px`, `font-weight: 600`, `color: #0F0533`, `line-height: 30px`

**Subtitle (department + role):**
- `font-size: 14px`, `font-weight: 400`, `color: #9996AA`, `line-height: 21px`
- Format: "Engineering · Engineering Manager"

**Points badge:**
- `font-size: 18px`, `font-weight: 600`, `color: #15803D`, `line-height: 27px`
- `background: #DCFCE7`
- `border-radius: 9999px` (fully rounded pill)
- `padding: 8px 18.141px 7px 18.75px` (approx `8px 18px 7px 19px`)
- `width: ~111px`, `height: ~42px` (fixed from Figma: W 147.89px, H 42px — actually `inline-flex`, `justify-content: center`, `align-items: center`)
- Text: "{points} points"

**Layout:** The hero card uses a horizontal flex layout with the avatar on the left and text content to the right. The avatar + rank badge is vertically centered. Text block contains name, subtitle, and points badge stacked vertically.

### 4. Content area alignment
- Remove `marginTop: -40` hack
- Set proper top padding to align with sidebar title

## File modified
- `src/pages/admin/Leaderboard.tsx`

