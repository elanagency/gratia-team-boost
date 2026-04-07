

## Fix Settings Page Layout

Two issues to fix:

### 1. Push content to top and extend divider full height

The Settings page currently has `space-y-6` on the outer div and `p-4 pt-16 lg:px-[60px] lg:pt-[72px]` from the parent layout. The "Settings" title and sidebar/content sit inside this padded area. To make it feel flush against the top and have the divider extend full height:

- Remove the `space-y-6` gap between title and content
- Make the sidebar + divider + content section stretch to fill the available height using `min-h-[calc(100vh-72px)]` (accounting for the layout's top padding)
- The divider already uses `flexShrink: 0` but needs explicit height — change it to `align-self: stretch` so it fills the flex container height

**File: `src/pages/admin/Settings.tsx`**
- Line 52: Change outer div from `space-y-6` to a flex column with specific gap for the title area only
- Line 64: Add `min-h-[calc(100vh-120px)]` to the flex row so the divider stretches
- Line 99: Add `alignSelf: 'stretch'` to the divider div
- Line 66: Make sidebar sticky/floating at the top with `position: sticky; top: 72px`

### 2. Wrap Company Profile and Company Values in a single bordered card

From the Figma: both sections are inside one container with `border-radius: 15px`, `border: 1px solid #E8E6F0`, `padding: 15px` on all sides, with `padding-right: 300px` area (the 300 is the right-side dead space in Figma, not relevant here — the card itself is `600px` wide in Figma).

**File: `src/components/settings/CompanyInformationCard.tsx`**
- Line 115: Wrap the entire return content in a single card div with `border-radius: 15px`, `border: 1px solid #E8E6F0`, `padding: 15px`
- Remove the horizontal divider (line 267) — in the Figma the two sections are separated by visual spacing only within the same card, or keep a subtle divider inside the card

### Files to modify
1. `src/pages/admin/Settings.tsx` — layout fixes for full-height divider and top alignment
2. `src/components/settings/CompanyInformationCard.tsx` — wrap in single bordered card

