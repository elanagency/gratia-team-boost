

# Improve Gift Cards Catalog Interface with Select All

## Problem

The current interface displays 60+ regions in a 2-column grid, making the cards extremely tall and difficult to use. Users need a way to quickly select/deselect all regions and better visual organization.

## Solution Overview

1. Add "Select All" / "Deselect All" toggle button
2. Constrain the region list to a scrollable container with max height
3. Add a summary of selected regions count
4. Improve visual hierarchy with better grouping

---

## Implementation Details

### Changes to `EnvironmentSyncCard.tsx`

**1. Add Select All functionality:**
```typescript
const allSelected = selectedRegions.length === displayRegions.length;
const noneSelected = selectedRegions.length === 0;

const handleSelectAll = () => {
  if (allSelected) {
    setSelectedRegions([]);
  } else {
    setSelectedRegions(displayRegions.map(r => r.region_code));
  }
};
```

**2. Add scrollable container for regions:**
- Wrap region grid in a `ScrollArea` component with `max-h-48` (192px)
- This limits the visible height while allowing scroll access to all regions

**3. Add header row with selection controls:**
```text
┌───────────────────────────────────────────────┐
│ Regions to Sync:    [Select All] [Clear]      │
│ 3 of 63 selected                              │
├───────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐   │
│ │ [x] AU Australia   [x] US United States │   │
│ │ [ ] CA Canada      [ ] GB United Kingdom│   │
│ │ ...scrollable...                        │   │
│ └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

**4. Visual improvements:**
- Show selected count vs total (e.g., "3 of 63 regions selected")
- Use `CheckCheck` icon for Select All button
- Add subtle border around scroll area
- Compact the region items slightly

---

## Technical Changes

### File: `src/components/platform/EnvironmentSyncCard.tsx`

| Change | Description |
|--------|-------------|
| Import `ScrollArea` | From `@/components/ui/scroll-area` |
| Import `CheckCheck` | Lucide icon for select all |
| Add `handleSelectAll` | Function to toggle all selections |
| Add `handleClearAll` | Function to clear all selections |
| Wrap region grid | In `ScrollArea` with `max-h-48` |
| Add selection header | Shows count and action buttons |

### Updated Region Section Layout

```
Before:
- 2-column grid, unlimited height
- No select all option
- Takes up entire card height

After:
- Header row with "Select All" / "Clear" buttons
- Selection count indicator (X of Y selected)
- Scrollable region list (max 192px height)
- Compact region items for better density
```

---

## Expected Outcome

1. **Compact cards** - Both Test and Production cards will have a consistent, manageable height
2. **Quick selection** - "Select All" button enables selecting all 60+ regions in one click
3. **Clear selection** - "Clear" button to quickly deselect all
4. **Visual feedback** - "3 of 63 regions selected" indicator
5. **Scrollable list** - All regions accessible without overwhelming the interface

