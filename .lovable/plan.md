

# Unified Fixed Sub-Sidebar for Settings & Leaderboard

## Problem
The Settings sidebar currently uses `position: sticky` and 220px width. The Leaderboard month filter is inline (scrolls with content). The Figma shows both pages should have a **fixed** secondary sidebar pinned flush against the main 300px sidebar, with identical dimensions and padding so switching between pages feels seamless.

## Figma Specs (from screenshots)
- Secondary sidebar: **240px wide**, fixed to viewport
- Left edge: flush against the main sidebar (starts at 300px from viewport left)
- Padding: **22.5px top**, **270px left-padding on content area** (to account for the sub-sidebar)
- Title: Inter, 22px, weight 600, color #0F0533, line-height 33px
- Nav items / month items: same styling as current but inside this fixed panel
- Right border: 1px solid #E8E6F0, full height
- Background: #FFFFFF

## Changes

### 1. Settings.tsx — Convert sidebar to fixed positioning
- Change sidebar from `sticky` to `fixed`, pinned at `left: 300px`, `top: 0`, `height: 100vh`, `width: 240px`
- Add `padding: 22.5px 0 0 270px` (or `marginLeft: 240px`) on content area to offset the fixed sidebar
- Keep all existing tab buttons and content rendering unchanged

### 2. Leaderboard.tsx — Extract month filter into fixed sidebar
- Move the month filter column out of the flex layout into a **fixed** sidebar identical to Settings
- Position: `fixed`, `left: 300px`, `top: 0`, `height: 100vh`, `width: 240px`
- Title "Leaderboard" moves into this sidebar (matching Settings' title style)
- Month filter items render below the title with a calendar icon
- Content area gets `marginLeft: 240px` offset with `padding: 22.5px`
- Remove the inline "Leaderboard" heading from the content area (it's now in the sidebar)

### 3. Both pages — Hide fixed sub-sidebar on mobile (`hidden lg:flex`)
- On screens < 1024px the main sidebar is already hidden, so the sub-sidebar should also hide
- Content area removes its left margin on mobile

## Files Modified
1. `src/pages/admin/Settings.tsx` — fixed sub-sidebar positioning
2. `src/pages/admin/Leaderboard.tsx` — extract month filter to fixed sub-sidebar

