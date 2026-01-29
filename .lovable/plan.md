

# Add Login Frequency Tracking & Analytics Metric

## Overview
Create a new `login_events` table to track user logins, then add a "Login Frequency" metric to the Analytics tab showing the number of logins per day/week.

---

## What You'll Get

### Database
- New `login_events` table storing each successful login with timestamp and user info
- RLS policies allowing users to see their own logins and company admins to see company-wide data

### Analytics Integration
- New "Activity" metric group in the left sidebar with a "Logins" sub-metric
- Chart showing login count over time (daily/weekly granularity)
- Supports department/person segmentation like other metrics

---

## Implementation Details

### 1. Database Migration

Create a new table `login_events`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `company_id` | uuid | For company-level filtering |
| `logged_in_at` | timestamptz | When the login occurred |
| `created_at` | timestamptz | Record creation time |

**RLS Policies:**
- Platform admins can view all login events
- Company admins can view their company's login events
- Users can view their own login events

**Indexes:**
- On `company_id` + `logged_in_at` for efficient date-range queries

---

### 2. Record Logins After Successful Auth

**Where to add the login recording:**

In `src/pages/Login.tsx`, after successful OTP verification (line ~133), insert a record into `login_events`:

```typescript
// After: toast.success("Login successful!");
// Insert login event
if (authData.user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', authData.user.id)
    .single();
    
  if (profile?.company_id) {
    await supabase.from('login_events').insert({
      user_id: authData.user.id,
      company_id: profile.company_id,
    });
  }
}
```

This ensures we only record logins for users with a company association (not platform admins without a company).

---

### 3. Update Analytics Data Hook

**File:** `src/hooks/useAnalyticsData.ts`

**Changes:**

1. Add `'logins'` to `MetricType`:
   ```typescript
   export type MetricType = 'received' | 'sent' | 'engagement' | 'redemptions' | 'logins';
   ```

2. Add case in the query switch:
   ```typescript
   case 'logins':
     return fetchLoginsData(companyId, startDate, endDate, segmentBy, granularity);
   ```

3. Create `fetchLoginsData` function:
   - Query `login_events` with profile joins for department/person segmentation
   - Group by date intervals (daily/weekly)
   - Return count of logins per interval

---

### 4. Update Metrics Sidebar

**File:** `src/components/analytics/AnalyticsMetricsSidebar.tsx`

Add new "Activity" group:

```typescript
{
  id: "activity",
  label: "Activity",
  icon: <LogIn className="h-4 w-4" />,
  items: [
    { id: "logins", label: "Logins", icon: <LogIn className="h-3.5 w-3.5" />, parent: "activity" },
  ],
},
```

Import `LogIn` icon from `lucide-react`.

---

### 5. Update Chart Labels

**File:** `src/components/analytics/AnalyticsChartArea.tsx`

Add labels for the new metric:

```typescript
const metricLabels: Record<MetricType, string> = {
  // ... existing
  logins: "Login Frequency",
};

const metricUnits: Record<MetricType, string> = {
  // ... existing
  logins: "logins",
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[timestamp]_add_login_events.sql` | Database table and RLS policies |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Login.tsx` | Insert login event after successful OTP verification |
| `src/hooks/useAnalyticsData.ts` | Add `logins` metric type and fetch function |
| `src/components/analytics/AnalyticsMetricsSidebar.tsx` | Add Activity group with Logins metric |
| `src/components/analytics/AnalyticsChartArea.tsx` | Add label/unit for logins metric |
| `src/components/analytics/AnalyticsDataTable.tsx` | Add label for logins metric (if needed) |

---

## Migration SQL Preview

```sql
-- Create login_events table
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_login_events_company_date 
  ON public.login_events (company_id, logged_in_at);
CREATE INDEX idx_login_events_user 
  ON public.login_events (user_id);

-- RLS Policies
CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view company login events"
  ON public.login_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.company_id = login_events.company_id
      AND profiles.is_admin = true
      AND profiles.status = 'active'
  ));

CREATE POLICY "Platform admins can view all login events"
  ON public.login_events FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "System can insert login events"
  ON public.login_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Implementation Order

1. **Create database migration** - Set up `login_events` table with RLS
2. **Update Login.tsx** - Record login events after successful OTP verification
3. **Update useAnalyticsData.ts** - Add `logins` metric type and fetch function
4. **Update AnalyticsMetricsSidebar.tsx** - Add Activity group with Logins item
5. **Update chart components** - Add labels and units for the new metric
6. **Test end-to-end** - Login as a user, verify event is recorded, check Analytics tab

---

## Edge Cases

- **Platform admins without company**: Skip recording (they don't have a `company_id`)
- **First-time users**: Login event still recorded alongside the status update
- **Failed logins**: No event recorded (we only track successful auths)
- **Session refresh**: Not recorded (only explicit OTP verification counts)

