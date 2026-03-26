

## Dashboard Spacing and Recognition Composer Refinements

### 1. Increase main content padding (UnifiedDashboardLayout)
**File: `src/pages/dashboard/UnifiedDashboardLayout.tsx`**
- Change `<main>` padding from `p-4 lg:p-6` to match Figma: `padding: 72px 145.5px 0 145.5px` on desktop (use `lg:px-[145px] lg:pt-[72px]`). On smaller screens keep reasonable padding.

### 2. Redesign GivePointsCard composer layout
**File: `src/components/points/GivePointsCard.tsx`**

**Remove internal bordered box**: Currently the text area is wrapped in a `border border-border rounded-lg` div (line 410). Remove that border — the outer card border is enough. Instead, add two horizontal divider lines:
- One below "Points to give" row
- One above the bottom icon/send row

**Avatar**: Use the user's actual profile picture from `avatarUrl` (from `useAuth()`) instead of the generic User icon fallback.

**"100 pts" pill becomes an editable input**: Replace the static "100 pts" button with a controlled input that:
- Displays as a pill (fully rounded) by default showing the current points value
- On click, becomes an editable number input within the pill
- User can type a custom point amount
- This value feeds into the recognition submission

**Fully rounded pill corners**: The three pills ("Select teammate", "Company value", "100 pts") already use `rounded-full` — confirm they render as fully rounded.

**Bottom icons — wire up functionality**:
- Emoji button (Smile icon): Open an emoji picker (use a simple emoji popover or the native emoji input)
- Image button (ImageIcon): Open a file picker to attach an image
- GIF button (LayoutGrid icon): Wire up to the existing `GiphyPicker` component (currently disconnected after the redesign)

### 3. Files to modify
1. `src/pages/dashboard/UnifiedDashboardLayout.tsx` — increase main content padding
2. `src/components/points/GivePointsCard.tsx` — remove inner box border, add dividers, use real avatar, make points pill editable, wire up emoji/image/GIF buttons

