

## Move "Settings" Title Into Sidebar & Add Content Padding

### Changes

**`src/pages/admin/Settings.tsx`**

1. **Move "Settings" title into the fixed sidebar** — place the `<h1>Settings</h1>` inside the fixed sidebar div, above the tab buttons, with `marginBottom: 18.75px`
2. **Add top padding to the content area** — add `paddingTop` to the content div so the Company Profile card doesn't start flush at the top. From the Figma, the content area has roughly 22.5px padding from the top before the card starts (matching the sidebar's title area alignment)

### Specifics
- In the fixed sidebar: insert `<h1>Settings</h1>` (Inter 22px, weight 600, color #0F0533) before the tab buttons, with ~18.75px bottom margin
- Content area: remove the `<h1>` from there, keep `marginLeft: 160` but no title above the content anymore

