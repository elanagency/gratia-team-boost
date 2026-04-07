

# Settings Page Redesign Plan

## Overview
Redesign all Settings tabs to match the Figma screenshots pixel-for-pixel, while preserving all existing functionality and features. The screenshots show a cleaner, more minimal design with consistent styling using the established design system (Inter font, #E8E6F0 borders, 13.375px radius, #F5F5F7 backgrounds).

## Changes by Tab

### 1. Company Tab
Already very close to screenshots. Minor tweaks:
- Remove the `<Info>` hint text under Gift Card Regions ("Contact support to modify...")
- Ensure spacing matches exactly

### 2. Team Tab (`TeamManagementCard.tsx` + `TeamMemberTable.tsx`)
Major visual redesign while keeping all functionality:
- **Header**: "Team Members" title with subtitle "Manage who has access to your workspace · {N} members"
- **Search bar**: Full-width search input with rounded style
- **Invite button**: Purple pill "+ Invite" button (top right, next to search)
- **Table columns**: NAME (with avatar + role subtitle), EMAIL, DEPARTMENT, BIRTHDAY, START DATE, ROLE (as purple text link-style, not badge)
- Remove Status column from the main visible columns
- Keep all action menus, CSV upload, Slack import, department management as existing features — just move buttons into a more compact arrangement
- Card styled with the standard border/radius system
- Avatar circles with initials shown next to names

### 3. Celebrations Tab (`CelebrationSettingsCard.tsx`)
Simplify the visual layout to match screenshot:
- **Title**: "Automated Celebrations" with subtitle
- **Birthdays section**: Title + description on left, Switch on right, reward amount input below
- **Work Anniversaries section**: Same layout
- **Save Changes button**: Purple gradient
- **Upcoming this month** section below
- **Recently sent** section below
- Remove the 2-column cost estimator layout — keep wallet/buy points but in simpler form
- Remove the yearly summary stats card and celebration history table, OR keep them below the fold
- Key: keep all the data and functionality, just restyle the top configuration section

### 4. Billing Tab (`BillingCard.tsx`)
Redesign from 4-column grid to a cleaner vertical layout:
- **"Current Plan"** header with subtitle "Manage your subscription and billing"
- **Plan box**: Rounded container showing "CURRENT PLAN" label, "Pro Plan" name, "$10 /seat/mo" price on right — styled with light purple/white background and subtle border
- **Line items below**: Seats (count × price = total), Total due, Next billing date, Payment method — each as a row with label left, value right
- **"Manage Your Subscription"** section: description text + purple "Manage Billing" button with external link icon
- All wrapped in standard card styling

### 5. Integrations Tab (`SlackNotificationsCard.tsx` + `TeamsNotificationsCard.tsx`)
Redesign while keeping ALL features (accordion sections, OAuth, notification toggles, import, user linking):

**Slack section:**
- **Header**: "Slack" title + subtitle "Connect your Slack workspace to send recognition notifications"
- **Connection row**: Workspace name + "Connected" status on left, "Disconnect" button on right (simple text button, not in a colored box)
- **Channel section**: "Channel" label, dropdown select (full width, dark/grey background), subtitle text
- **Bot invite row**: "Add Grattia Bot to Your Channel" as a clickable row with chevron
- Keep notification toggles, import, and user linking accessible (via accordion or expandable sections)

**Microsoft Teams section:**
- **Header**: "Microsoft Teams" + subtitle
- **Connection row**: Teams icon, "Not Connected" text, purple "Connect" button on right
- Keep all existing OAuth flow, team/channel picker, notification toggles, test/disconnect functionality

### Technical Approach
- Restyle components using inline styles matching the design system (Inter font, specific colors, radii)
- No new dependencies needed
- Preserve all hooks, state management, mutations, real-time subscriptions
- Keep all dialogs (delete member, edit member, CSV upload, Slack import, buy points, etc.)

### Files to Edit
1. `src/components/settings/TeamManagementCard.tsx` — header/layout redesign
2. `src/components/team/TeamMemberTable.tsx` — table column/row redesign with avatars
3. `src/components/settings/BillingCard.tsx` — vertical layout redesign
4. `src/components/settings/CelebrationSettingsCard.tsx` — simplified config layout
5. `src/components/settings/SlackNotificationsCard.tsx` — cleaner integration layout
6. `src/components/settings/TeamsNotificationsCard.tsx` — cleaner integration layout
7. `src/components/settings/CompanyInformationCard.tsx` — minor spacing tweaks

