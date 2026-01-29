

# Analytics Tab for Company Admins

## Overview
Add a new "Analytics" tab to the company admin dashboard that provides insights into team recognition activity, redemptions, and engagement metrics. The design follows the RevenueCat pattern with a left sidebar for metric selection and a main chart area with filtering controls.

---

## What You'll Get

### Layout (RevenueCat-inspired)
- **Left Sidebar**: Collapsible list of metric categories with selectable chart options
- **Main Chart Area**: Large area chart with date range filtering and segment controls
- **Data Table**: Below the chart showing daily/weekly breakdowns

### Four Key Metrics

| Metric | Description | Data Source |
|--------|-------------|-------------|
| **Recognition Received** | Points received per person/department over time | `point_transactions` (recipient) |
| **Recognition Sent** | Points given per person/department over time | `point_transactions` (sender) |
| **Engagement Rate** | Percentage of team members actively giving/receiving recognition | `point_transactions` + `profiles` |
| **Redemptions** | Points spent on gift cards over time | `redemptions` table |

> Note: "User Activity" (time spent) would require session tracking infrastructure. Instead, "Engagement Rate" provides a meaningful proxy using existing data.

### Filtering Controls
- **Date Range**: Preset options (Last 7 days, Last 30 days, Last 90 days, This month, Last month) + custom date picker
- **Segment By**: Department or Individual person
- **Granularity**: Daily or Weekly view

---

## Technical Implementation

### Files to Create

```text
src/pages/admin/Analytics.tsx           # Main Analytics page
src/components/analytics/
  ├── AnalyticsMetricsSidebar.tsx      # Left sidebar with metric list
  ├── AnalyticsChartArea.tsx           # Main chart + controls
  ├── AnalyticsFilters.tsx             # Date range + segment dropdowns
  └── AnalyticsDataTable.tsx           # Tabular data below chart
src/hooks/useAnalyticsData.ts          # Data fetching hook
```

### Files to Modify

```text
src/App.tsx                             # Add /dashboard/analytics route
src/components/dashboard/
  DashboardTopNavigation.tsx            # Add Analytics nav item (admin-only)
```

---

### Route & Navigation

**New route** at `/dashboard/analytics` (admin-only):
```tsx
// In App.tsx
<Route path="analytics" element={<Analytics />} />
```

**Navigation update** in `DashboardTopNavigation.tsx`:
```tsx
const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  ...(isAdmin ? [
    { name: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" }
  ] : [])
];
```

---

### UI Components

#### 1. Analytics Page Layout
```text
+------------------------------------------------------------------+
| Analytics                                          [Date Filter] |
+---------------+--------------------------------------------------+
|               |                                                  |
| METRICS       |  [Chart Title]        [Segment ▾] [Granularity] |
|               |                                                  |
| Recognition   |  ╭──────────────────────────────────────────╮   |
| ├ Received    |  │                                          │   |
| └ Sent        |  │         Area/Line Chart                  │   |
|               |  │                                          │   |
| Engagement    |  ╰──────────────────────────────────────────╯   |
| └ Rate        |                                                  |
|               |  +------+------+------+------+------+------+    |
| Redemptions   |  | Date | Value| ...  | ...  | ...  | Avg  |    |
| └ Points      |  +------+------+------+------+------+------+    |
|               |  | Jan 1| 245  | ...  | ...  | ...  | 203  |    |
+---------------+--------------------------------------------------+
```

#### 2. Metric Sidebar Items
Each metric in the left sidebar:
- Icon + label
- Selected state highlight (accent color `#F572FF`)
- Nested sub-metrics (collapsible)

#### 3. Chart Area
- Recharts `AreaChart` with gradient fill (matching RevenueCat style)
- Responsive container
- Tooltip showing exact values on hover
- Accent color `#F572FF` for primary data series

#### 4. Filters Bar
- Date range dropdown with presets
- Custom date picker (using existing Calendar component)
- Segment dropdown (All, By Department, By Person)
- Granularity toggle (Daily/Weekly)

---

### Data Fetching Hook

```typescript
// src/hooks/useAnalyticsData.ts
export function useAnalyticsData({
  metric,           // 'received' | 'sent' | 'engagement' | 'redemptions'
  dateRange,        // { start: Date, end: Date }
  segmentBy,        // 'none' | 'department' | 'person'
  granularity,      // 'daily' | 'weekly'
}) {
  // Fetch from point_transactions or redemptions based on metric
  // Group by date and optionally by segment
  // Return chartData, tableData, summary stats
}
```

**Queries by metric:**

| Metric | Query |
|--------|-------|
| Received | `point_transactions` grouped by `recipient_profile_id`, sum `points` |
| Sent | `point_transactions` grouped by `sender_profile_id`, sum `points` |
| Engagement | Count unique senders + recipients / total active members |
| Redemptions | `redemptions` grouped by date, sum `points_spent` |

---

### Styling Notes

- **Font**: Roboto (already configured)
- **Accent Color**: `#F572FF` for charts, selected states
- **Hover States**: Subtle grey (`hover:bg-gray-100`) per project guidelines
- **Chart Fill**: Gradient from `#F572FF` with low opacity to transparent
- **Cards**: Use existing `Card` component with consistent borders

---

## Implementation Order

1. **Create data hook** (`useAnalyticsData.ts`) - Core data fetching logic
2. **Create page skeleton** (`Analytics.tsx`) - Basic layout with sidebar + main area
3. **Build metrics sidebar** (`AnalyticsMetricsSidebar.tsx`) - Metric selection
4. **Build chart area** (`AnalyticsChartArea.tsx`) - Recharts integration
5. **Add filters** (`AnalyticsFilters.tsx`) - Date range + segment controls
6. **Add data table** (`AnalyticsDataTable.tsx`) - Tabular breakdown
7. **Update routing** - Add route and navigation item
8. **Polish** - Responsive design, loading states, empty states

---

## Edge Cases & Considerations

- **No data**: Show friendly empty state with guidance
- **Loading**: Show skeleton placeholders (matching existing patterns)
- **Mobile**: Stack sidebar above chart, simplify controls
- **Large datasets**: Limit to last 90 days by default, paginate if needed
- **RLS**: All queries already respect company-level access via existing policies

