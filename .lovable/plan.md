

# Condense Header Buttons into a Dropdown Menu

## Problem
The three action buttons (Departments, Slack Import, Upload CSV) at the top of the Team Members card look cluttered. They should be condensed into a single dropdown menu.

## Change

### `src/components/settings/TeamManagementCard.tsx`
- Replace the three separate buttons (Departments, Slack Import, CSV Upload) with a single `DropdownMenu` trigger button (e.g., an ellipsis/more icon or a "More actions" button styled to match the design system)
- The dropdown will contain three menu items:
  - **Departments** — opens the existing Department Management dialog
  - **Import from Slack** — opens the Slack Import dialog (only shown when Slack is connected)
  - **Upload CSV** — triggers the CSV upload flow
- The trigger button will use the same outline style as the current buttons: `borderRadius: 13.375`, `borderColor: #E8E6F0`, `height: 34`, `fontSize: 13`
- The Departments dialog and Slack Import dialog will be triggered via state (same as now) rather than `DialogTrigger`, since they'll be inside dropdown items
- CSVUploadDialog will also be controlled via state

### Components used
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from existing `src/components/ui/dropdown-menu.tsx`
- `MoreHorizontal` or `ChevronDown` icon from lucide-react for the trigger
- Existing `Dialog` for Departments (switched to controlled open/close)

### Files modified
- `src/components/settings/TeamManagementCard.tsx`

