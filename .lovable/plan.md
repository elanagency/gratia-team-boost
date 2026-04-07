

## Redesign Analytics Page to Match Figma

### Current State
The analytics page has a left sidebar with metric tabs (Received, Sent, Engagement, Redemptions, DAU), showing one chart at a time with a data table below.

### New Design (from Figma)
All metrics displayed as separate chart cards on a single scrollable page. No left sidebar. Three chart sections stacked vertically:

1. **Recognition Trend** — grouped bar chart with Sent (#7F2BFE) and Received (#FC5BFF) side by side
2. **Participation Rate** — line chart in purple (#7F2BFE)
3. **Redemptions** — bar chart in purple (#7F2BFE)

### Figma Specs
- **Page title**: "Analytics" — Inter, large/bold, color #0F0533
- **Filters row**: "All Departments" dropdown + Daily | Weekly | **Monthly** toggle + Custom button, right-aligned
- **Chart cards**: `border-radius: 15px`, `border: 1px solid #E8E6F0`, white bg, `padding: 19.75px`
- **Chart titles**: Inter 15px, weight 600, color #0F0533
- **Y-axis labels**: Inter 12px, weight 400, color #9996AA, right-aligned
- **X-axis labels**: Inter 12px, weight 400, color #9996AA (month abbreviations: Oct, Nov, Dec...)
- **Grid lines**: dashed, stroke #E8E6F0, horizontal only
- **Recognition Trend legend**: bottom-center, "Sent" (purple square) + "Received" (pink square), Inter 12px weight 400 color #FC5BFF/#7F2BFE
- **Bar colors**: Sent = #7F2BFE, Received = #FC5BFF
- **Participation Rate line**: stroke #7F2BFE, smooth curve
- **Redemptions bars**: fill #7F2BFE

### Table View
Add a simple Graph/Table toggle so users can flip to the existing table view for any metric. The table remains available but isn't the default.

### Technical Plan

**1. Rewrite `src/pages/admin/Analytics.tsx`**
- Remove `AnalyticsMetricsSidebar` import and rendering
- Remove `selectedMetric` state — no longer switching between metrics
- Keep `dateRange`, `segmentBy`, `granularity` state
- Fetch all three datasets (recognition combined sent+received, engagement, redemptions) using three separate `useAnalyticsData` calls
- Add a `viewMode` state: `'chart' | 'table'`
- Render filters row at top, then three chart cards stacked vertically (or table view)
- Full-width layout (no sidebar)

**2. Create `src/components/analytics/AnalyticsAllCharts.tsx`**
- Three chart card sections:
  - **RecognitionTrendChart**: Uses `BarChart` with two `Bar` components (sent + received), grouped. Colors: `#7F2BFE` and `#FC5BFF`. Legend at bottom.
  - **ParticipationRateChart**: Uses `LineChart` with single `Line`, stroke `#7F2BFE`, smooth `monotone` type
  - **RedemptionsChart**: Uses `BarChart` with single `Bar`, fill `#7F2BFE`
- Each card: `rounded-[15px] border border-[#E8E6F0] bg-white`, padding `19.75px`
- Title: Inter 15px weight 600 color #0F0533
- Shared axis styling: color #9996AA, 12px, weight 400
- Grid: dashed #E8E6F0, horizontal only

**3. Update `src/components/analytics/AnalyticsFilters.tsx`**
- Remove `segmentBy` selector from the main filter bar (keep it internally or in a secondary control)
- Match Figma: "All Departments" dropdown on left, Daily/Weekly/Monthly toggle pills, Custom date button
- Monthly toggle: filled purple (#7F2BFE) when active

**4. Update `src/hooks/useAnalyticsData.ts`**
- No structural changes needed — we'll just call the hook three times with different metrics
- Or add a new hook that fetches all metrics at once for efficiency

**5. Delete or deprecate `src/components/analytics/AnalyticsMetricsSidebar.tsx`**
- No longer used

**6. Keep `src/components/analytics/AnalyticsDataTable.tsx`**
- Used when user toggles to table view
- May need minor updates for multi-metric table display

### Files to modify/create
1. `src/pages/admin/Analytics.tsx` — full rewrite
2. `src/components/analytics/AnalyticsAllCharts.tsx` — new component
3. `src/components/analytics/AnalyticsFilters.tsx` — simplify to match Figma
4. `src/components/analytics/AnalyticsChartArea.tsx` — can be removed/replaced
5. `src/components/analytics/AnalyticsMetricsSidebar.tsx` — remove

