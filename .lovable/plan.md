

# Settings Page: Tab-Based Layout

## What Changes

Replace the current vertically stacked layout (long scroll) with a horizontal **tab bar** similar to the reference screenshot. Each major section becomes its own tab, so only one section is visible at a time.

## Proposed Tabs

| Tab Label       | Component(s)                                    |
|-----------------|------------------------------------------------|
| Company         | `CompanyInformationCard`                        |
| Departments     | `DepartmentManagement`                          |
| Team            | `TeamManagementCard`                            |
| Billing         | `BillingCard`                                   |
| Notifications   | `SlackNotificationsCard` + `TeamsNotificationsCard` |

## Technical Details

### `src/pages/admin/Settings.tsx`

- Import `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`
- Wrap content in a `<Tabs defaultValue="company">` container
- Add a `<TabsList>` with five triggers: Company, Departments, Team, Billing, Notifications
- Each `<TabsContent>` renders the corresponding component(s)
- The Notifications tab will contain both Slack and Teams cards stacked vertically
- URL does not need to change per tab (simple client-side state)

### Result

- No scrolling through unrelated sections
- Clean horizontal navigation matching the reference design
- One file changed, no new files needed

