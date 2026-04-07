

## Redesign Settings Page to Match Figma

### Layout Change
Replace the current horizontal `Tabs` layout with a two-column layout: a vertical sidebar menu on the left and the content area on the right. This matches the Figma pattern with sidebar navigation items stacked vertically.

### Figma Specs

**Page title**: "Settings" — Inter 22px, weight 600, color `#0F0533`

**Sidebar navigation**:
- Vertical list of tab buttons with icons (16x16) + text
- Items: Company, Team, Celebrations, Billing, Integrations (renamed from "Notifications")
- Each button: `width: 100%`, `height: 36px` (fixed), `padding: 7.5px 139.375px 7.5px 11.25px`, `gap: 9.375px`, `border-radius: 13.375px`, `bg: #F5F5F7` when active
- Active text: Inter 14px, weight 500, color `#0F0533`
- Inactive text: Inter 14px, weight 500, muted color `#9996AA`
- Icons for each: Building (Company), Users (Team), Sparkles (Celebrations), CreditCard (Billing), Settings2 (Integrations)
- Sidebar separated from content by a vertical `1px solid #E8E6F0` divider

**Content area**: Right side, takes remaining width. `padding-right: 300px` area for content, `gap: 18.75px` between sections.

**Company Profile section** (card with no visible border, just grouped content):
- Section title: "Company Profile" — Inter 15px, weight 600, color `#0F0533`
- Subtitle: "Basic information about your organization" — muted
- "Company Name" label + input with value "Acme Corp" — input `rounded-[13.375px]`, `border: 1px solid #E8E6F0`, `bg: #F5F5F7`, `height: 38px`
- "Company Logo" — icon placeholder + "Upload" button
- "Gift Card Regions" — region badges (flag + country name pills)

**Company Values section** (separate card below):
- Title: "Company Values" — Inter 15px, weight 600, color `#0F0533`
- Subtitle: "Define the values used when giving recognition"
- List of values (Teamwork, Innovation, Leadership, etc.) each in a row with a delete (trash) icon
- "+ Add Value" button at bottom, centered

### Technical Plan

**1. Rewrite `src/pages/admin/Settings.tsx`**
- Replace `Tabs` with a custom two-column layout using `useState` for `activeTab`
- Left column: vertical nav sidebar (~240px) with icon+text buttons
- Right column: content area rendering the appropriate component
- Vertical divider between sidebar and content (`1px solid #E8E6F0`)
- Rename "Notifications" tab to "Integrations"

**2. Update `src/components/settings/CompanyInformationCard.tsx`**
- Restructure into two visual sections: "Company Profile" and "Company Values"
- Remove the `Card` wrapper with header — use plain sections with headings
- Company Profile: show Company Name input (read-only styled as Figma input), Company Logo area, Gift Card Regions
- Company Values: list values from `useCompanyValues` hook with trash icon to delete, "+ Add Value" button
- Add `deleteValue` function to `useCompanyValues` hook (soft-delete by setting `is_active = false`)
- Input styling: `rounded-[13.375px]`, `border-[#E8E6F0]`, `bg-[#F5F5F7]`, `h-[38px]`

**3. Update `src/hooks/useCompanyValues.ts`**
- Add `deleteValue(id: string)` method that sets `is_active = false`

### Files to modify
1. `src/pages/admin/Settings.tsx` — full layout rewrite (vertical sidebar tabs)
2. `src/components/settings/CompanyInformationCard.tsx` — restructure with Company Values section
3. `src/hooks/useCompanyValues.ts` — add delete method

