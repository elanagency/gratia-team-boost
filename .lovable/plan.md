

# Apply Consistent Padding to Analytics & Gift Card Pages

## What changes

Both pages need 22.5px top padding and 135.5px horizontal padding, matching the Figma specs. The `UnifiedDashboardLayout` wrapper adds `lg:px-[60px] lg:pt-[72px]` by default, so we need to cancel that and apply the correct values.

## Changes

### 1. `src/pages/admin/Analytics.tsx`
- Replace the outer `<div className="flex-1 overflow-auto p-6">` with a wrapper that negates layout padding: `className="-mx-4 -mt-16 lg:-mx-[60px] lg:-mt-[72px]"`
- Apply correct padding via inline style: `padding: "22.5px 135.5px"`
- Remove the `max-w-6xl mx-auto` constraint (the horizontal padding handles centering now)
- Update the title to use Inter font, 22px, weight 600, line-height 33px per Figma

### 2. `src/pages/team/GiftCardShop.tsx`
- Wrap the return in a container with the same negative margin pattern
- Apply `padding: "22.5px 135.5px"` inline
- Title already matches Figma specs (22px Inter 600)

### Files modified
- `src/pages/admin/Analytics.tsx`
- `src/pages/team/GiftCardShop.tsx`

