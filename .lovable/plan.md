

# Add Color Picker & Edit Functionality to Company Values

## Problem
1. When creating a new company value, the color is hardcoded to `#7F2BFE` with no way to choose
2. Existing company values cannot be edited (name or color)

## Changes

### `src/hooks/useCompanyValues.ts`
- Add an `updateValue` function that calls `supabase.from('company_values').update({ name, color }).eq('id', id)` and updates local state

### `src/components/settings/CompanyInformationCard.tsx`

**Color picker for new values:**
- Add a `newValueColor` state (default `#7F2BFE`)
- When `isAddingValue` is true, show a row of preset color swatches (e.g. `#7F2BFE`, `#FC5BFF`, `#F59E0B`, `#22C55E`, `#3B82F6`, `#EF4444`, `#8B5CF6`, `#EC4899`) as small clickable circles next to the name input
- Pass `newValueColor` to `addValue()` instead of hardcoded `#7F2BFE`

**Edit existing values:**
- Add `editingValueId`, `editingValueName`, `editingValueColor` state
- Clicking on an existing value row (or a pencil icon) enters edit mode for that value: shows an input for the name + the same color swatches
- Save/Cancel buttons to commit or discard changes via `updateValue`
- Replace the static display with the inline editor when `editingValueId` matches

### Files modified
- `src/hooks/useCompanyValues.ts`
- `src/components/settings/CompanyInformationCard.tsx`

