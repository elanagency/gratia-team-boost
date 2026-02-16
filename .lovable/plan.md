

# Rename "Login Frequency" to "Daily Active Users" in Chart and Table

## Summary
The sidebar already says "Daily Active Users" but the chart title still shows "Login Frequency" and the unit says "logins". These need to be updated to match.

## Changes

### File: `src/components/analytics/AnalyticsChartArea.tsx`
- **Line 32**: Change `logins: "Login Frequency"` to `logins: "Daily Active Users"`
- **Line 40**: Change `logins: "logins"` to `logins: "users"` (so totals read "23 users" instead of "23 logins")

### File: `src/components/analytics/AnalyticsDataTable.tsx`
- **Line 21**: Change `logins: ""` to `logins: ""` (already blank, no change needed here)

Two small string changes, no logic changes.
