

## Refine Analytics Filters to Match Figma Specs

From the Figma screenshots, several small details differ from the current implementation:

### 1. Active granularity button color
- **Current**: `backgroundColor: '#7F2BFE'` (purple)
- **Figma**: `background: #0F0533` (dark navy), `color: #FFF`, `border-radius: 7.375px`
- Fix line 85

### 2. Granularity toggle container border-radius
- **Current**: `rounded-[9.375px]`
- **Figma**: The container has no visible border-radius separate from the buttons; each button has `border-radius: 7.375px`. The container itself should use `rounded-[7.375px]`
- Fix line 107

### 3. "All Departments" dropdown
- **Current**: `rounded-[9.375px]`, `w-[160px]`
- **Figma**: `border-radius: 13.375px`, Inter 12px weight 500 color `#0F0533`
- Fix line 96: change to `rounded-[13.375px]`, add inline style for font

### 4. "Custom" date button
- **Current**: `rounded-[9.375px]`
- **Figma**: `border-radius: 13.375px`, `border: 1px solid #E8E6F0`, text color `#9996AA`
- Fix line 132: change to `rounded-[13.375px]`

### 5. Department dropdown content
- **Figma** shows items like "All Departments" (highlighted), "Engineering", "Design", "Product", "People Ops", "Other" — these should come from the actual departments. For now, keep the existing segment options but ensure the popover styling matches.

### 6. Button text label
- **Current**: Shows preset label like "Last 30 days"
- **Figma**: Shows "Custom" with a calendar icon
- Fix line 136-138: Always show "Custom" as the button label

### Files to modify
1. `src/components/analytics/AnalyticsFilters.tsx` — update border-radius values, active button bg color, and Custom button label

