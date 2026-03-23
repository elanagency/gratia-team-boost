

## Fix Slack Import & Redesign Notifications Card

### Three Changes

**1. Add "Import from Slack" button to Team tab (`TeamManagementCard.tsx`)**

The button exists in `TeamManagementHeader.tsx` but that component isn't used on the Settings > Team tab. The Team tab uses `TeamManagementCard.tsx` directly. Add the same "Import from Slack" button to the header row, next to "Manage Departments" and "Invite Team Member", conditionally shown when Slack is connected.

**2. Fix scroll in `SlackImportDialog.tsx`**

The `ScrollArea` has `max-h-[400px]` but the dialog uses `flex flex-col` with `max-h-[85vh]`. The issue is the ScrollArea needs `overflow-y-auto` as a fallback and the flex container needs proper constraints. Change the ScrollArea to use a fixed height with `overflow-y-auto` style and ensure the parent flex layout properly constrains it.

**3. Restructure `SlackNotificationsCard.tsx` into collapsible accordion sections**

Replace the flat layout with 4 collapsible sections using the existing Accordion component:

| Section | Contents |
|---------|----------|
| **Channel** | Default channel selector + bot invite instructions |
| **Notification Types** | All 4 notification toggle switches |
| **Import Team** | Import from Slack button + SlackImportDialog |
| **User Linking** | SlackUserLinking component + Auto-Link |

The connection status bar and header remain at the top (not collapsible). Each section is an `AccordionItem` that opens/closes independently (`type="multiple"`).

### Files Changed

| File | Change |
|------|--------|
| `src/components/settings/TeamManagementCard.tsx` | Add "Import from Slack" button using `useSlackIntegration` hook, add `SlackImportDialog` |
| `src/components/team/SlackImportDialog.tsx` | Fix ScrollArea overflow so member list scrolls |
| `src/components/settings/SlackNotificationsCard.tsx` | Restructure connected state into 4 Accordion sections |

