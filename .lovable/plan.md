
# Fix Department Dropdown Click Issue (Take 2)

## Root Cause

The `PopoverContent` component uses `PopoverPrimitive.Portal` to render at the document body level. However, the Dialog's overlay also renders at the body level with `z-50` and captures all pointer events. Since both the overlay and popover share `z-50`, the overlay intercepts mouse clicks before they reach the popover items.

`modal={false}` prevents the Popover itself from creating a blocking layer, but does nothing about the parent Dialog's overlay.

## Solution

**File: `src/components/team/NewDepartmentCombobox.tsx`**

Update the `PopoverContent` to use a higher z-index (`z-[200]`) and add `style={{ pointerEvents: 'auto' }}` to ensure clicks reach the popover items even when rendered above the Dialog overlay.

```diff
- <PopoverContent className="w-full p-0" align="start">
+ <PopoverContent className="w-full p-0 z-[200]" align="start" style={{ pointerEvents: 'auto' }}>
```

This is a one-line change. The `z-[200]` ensures the popover renders above the Dialog overlay (`z-50`), and `pointerEvents: 'auto'` explicitly re-enables mouse interaction.

## Technical Details

| File | Change |
|------|--------|
| `src/components/team/NewDepartmentCombobox.tsx` | Add `z-[200]` and `pointerEvents: 'auto'` to `PopoverContent` |
