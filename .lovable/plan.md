
# Add Daily Active User Tracking

## Summary
Record a "session event" each time a user visits the dashboard, limited to once per day per user. This makes the "User Activity" metric reflect true daily usage rather than just OTP login frequency. Users who stay logged in for days will still register daily activity.

## How It Works
1. When the dashboard loads, check if a `login_events` row already exists for this user today
2. If not, insert one -- reusing the existing `login_events` table so the analytics queries need zero changes
3. The analytics "User Activity" metric automatically picks up these new events

## Technical Details

### File: `src/pages/admin/Dashboard.tsx`
- Add a `useEffect` that runs once on mount (when `user` and `companyId` are available)
- Query `login_events` for a row matching `user_id` and `company_id` where `logged_in_at >= start of today (UTC)`
- If no row exists, insert a new `login_events` row
- This runs silently in the background; errors are logged but don't block the UI

### File: `src/pages/dashboard/UnifiedDashboardLayout.tsx`
- Add the same daily session tracking logic here, since this is the layout wrapper that loads for every dashboard visit
- Actually, since `Dashboard.tsx` is a child of `UnifiedDashboardLayout`, placing it in the layout ensures it fires for all dashboard sub-pages (analytics, gift cards, settings), not just the main dashboard
- Move the tracking logic to `UnifiedDashboardLayout.tsx` instead, so any dashboard page visit counts

### Revised approach -- single location
Place the tracking in `UnifiedDashboardLayout.tsx` only (the parent layout), so it fires once regardless of which dashboard sub-page the user lands on.

### File: `src/pages/dashboard/UnifiedDashboardLayout.tsx`
- Import `startOfDay` from `date-fns`
- Add a `useEffect` after the existing effects:
  - Guard: only run when `user` and `companyId` (from `useAuth`) are available, and user is not deactivated
  - Query: `supabase.from('login_events').select('id').eq('user_id', user.id).eq('company_id', companyId).gte('logged_in_at', startOfDay(new Date()).toISOString()).limit(1)`
  - If the result is empty, insert: `supabase.from('login_events').insert({ user_id: user.id, company_id: companyId })`
  - Wrap in try/catch, log errors silently
  - Use a ref to prevent duplicate calls during React strict mode re-renders

### No database changes needed
The existing `login_events` table already has `user_id`, `company_id`, and `logged_in_at` (defaults to `now()`). No schema migration required.

### No analytics query changes needed
The `fetchLoginsData` and `fetchLoginsTotal` functions already query `login_events` by date range -- the new daily session rows will be picked up automatically.

### Renamed metric label
- **File: `src/components/analytics/AnalyticsMetricsSidebar.tsx`** -- Change the label for the `logins` metric from `"User Activity"` to `"Daily Active Users"` to better describe the updated behavior, and update the subtitle description accordingly.
