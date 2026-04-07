

## Two Changes: Right Panel Visibility + Company Values Feature

### 1. Right Panel: Only visible on Dashboard index page

**Problem**: The right panel (PersonalStatsCard, LeaderboardCard, UpcomingCelebrations) shows on all `/dashboard/*` routes. It should only appear on `/dashboard` (the index).

**Change in `src/pages/dashboard/UnifiedDashboardLayout.tsx`**:
- Import `useLocation` from react-router-dom
- Conditionally render the `<aside>` and the `lg:pr-[350px]` offset only when `location.pathname === "/dashboard"`

---

### 2. Company Values: Full CRUD with inline popover in recognition composer

**Problem**: The "Company value" pill button in GivePointsCard does nothing. There's no table, no UI to manage values.

#### Database migration
Create a `company_values` table:
```sql
CREATE TABLE public.company_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#7F2BFE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_values ENABLE ROW LEVEL SECURITY;
-- RLS: company members can view, admins can manage
CREATE POLICY "Company members can view values" ON public.company_values FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company admins can manage values" ON public.company_values FOR ALL USING (is_company_admin(company_id)) WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Platform admins can manage all values" ON public.company_values FOR ALL USING (is_platform_admin()) WITH CHECK (is_platform_admin());
```

Add a `company_value_id` column to `point_transactions`:
```sql
ALTER TABLE public.point_transactions ADD COLUMN company_value_id uuid REFERENCES public.company_values(id);
```

#### Frontend changes

**New file: `src/hooks/useCompanyValues.ts`**
- Hook to fetch company values from `company_values` table filtered by `company_id` and `is_active = true`
- Mutation to insert a new value (name + color)

**Modified: `src/components/points/GivePointsCard.tsx`**
- Add state for `selectedValue` (id, name, color)
- Wire the "Company value" pill to open a `Popover` showing:
  - List of existing company values as clickable colored pills
  - A small "Add new" row at the bottom with a text input + color picker + "Add" button
- When a value is selected, the pill changes to show the value name with its color as background
- Include `company_value_id` in the point transaction insert
- Admins and regular users can both add new values inline (simple approach); alternatively restrict creation to admins only

**Modified: `src/components/points/RecognitionFeed.tsx`**
- Display the company value tag on recognition items that have one (fetch via join or separate query)

### Files to modify/create
1. `src/pages/dashboard/UnifiedDashboardLayout.tsx` — conditional right panel
2. `supabase/migrations/` — new migration for `company_values` table + `point_transactions` column
3. `src/hooks/useCompanyValues.ts` — new hook
4. `src/components/points/GivePointsCard.tsx` — popover for value selection + inline creation
5. `src/components/points/RecognitionFeed.tsx` — display value tag on feed items

