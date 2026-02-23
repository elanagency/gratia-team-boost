

# Fix Department Dropdown Click Issue in Invite Dialog

## Problem

The department combobox uses a Radix `Popover` inside a Radix `Dialog`. When a Dialog is modal (default), it traps pointer events, which prevents clicking on Popover items. Keyboard navigation works because it bypasses pointer event handling.

## Solution

**File: `src/components/team/NewDepartmentCombobox.tsx`**

Add `modal={false}` to the `Popover` component. This tells Radix not to create its own focus-trapping overlay, which would conflict with the parent Dialog's overlay.

```diff
- <Popover open={open} onOpenChange={setOpen}>
+ <Popover open={open} onOpenChange={setOpen} modal={false}>
```

This is a single-line change. No other files need modification.

## Technical Details

| File | Change |
|------|--------|
| `src/components/team/NewDepartmentCombobox.tsx` | Add `modal={false}` to `Popover` |

