
# Fix Region Setup Dialog - RLS & UX Improvements

## Issues Identified

### 1. RLS Policy Missing (Root Cause of Save Failure)
The `company_regions` table only has:
- SELECT policies for company members
- ALL policy for platform admins only

**No INSERT policy exists for company admins**, which is why "Failed to save region settings" appears.

### 2. UX Improvements Requested
Current: Shows dropdown immediately with separate region card
Requested: Cleaner flow with "Change" button to reveal dropdown

---

## Solution

### Phase 1: Fix RLS Policy

Add an INSERT policy allowing company admins to add regions for their own company during initial setup:

```sql
CREATE POLICY "Company admins can insert their own regions during setup"
ON company_regions
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'active'
  )
  AND 
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_id
    AND companies.region_setup_complete = false
  )
);
```

This policy ensures:
- Only company admins can insert
- Only for their own company
- Only when `region_setup_complete` is still `false` (prevents future manipulation)

### Phase 2: Redesign Dialog UX

**New Flow:**
1. Show detected region with flag, name, and currency
2. Display a "Change" button that reveals a dropdown
3. Once a region is selected from dropdown, update the display
4. Keep Global checkbox option
5. Confirm & Continue button

**Visual Structure:**
```
+--------------------------------------------------+
|  Welcome to Grattia!                             |
|  Let's set up your reward region to get started. |
|                                                  |
|  [MapPin] We detected you're in:                 |
|                                                  |
|  +--------------------------------------------+  |
|  |  [UK Flag]  United Kingdom                 |  |
|  |             Currency: GBP                  |  |
|  |                           [Change Button]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  (If "Change" clicked, show dropdown below)      |
|                                                  |
|  +--------------------------------------------+  |
|  | [ ] Also include Global gift cards         |  |
|  |     Visa, Mastercard, international options|  |
|  +--------------------------------------------+  |
|                                                  |
|            [Confirm & Continue]                  |
+--------------------------------------------------+
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| New migration file | Create | Add INSERT policy for company admins |
| `src/components/onboarding/RegionSetupDialog.tsx` | Modify | Redesign UX with "Change" button flow |

---

## Technical Details

### RegionSetupDialog Changes

1. Add `isChanging` state to control dropdown visibility
2. Remove always-visible dropdown
3. Add "Change" button that sets `isChanging = true`
4. When changing, show Select dropdown
5. Pre-select the detected region by default (already working via useEffect)

```tsx
// Key state changes
const [isChanging, setIsChanging] = useState(false);

// Show either the region card with Change button, or the dropdown
{!isChanging ? (
  <RegionCard 
    regionCode={selectedRegion} 
    onChangeClick={() => setIsChanging(true)} 
  />
) : (
  <Select value={selectedRegion} onValueChange={(val) => {
    setSelectedRegion(val);
    setIsChanging(false);
  }}>
    ...
  </Select>
)}
```

---

## Summary

| Issue | Fix |
|-------|-----|
| "Failed to save region settings" | Add RLS INSERT policy for company admins during setup |
| Dropdown always visible | Hide by default, show on "Change" click |
| Cleaner UX | Single region card with flag, name, currency, and Change button |
