

## Invite Team Members from Slack Workspace

### The Idea — Assessment

This is a **strong feature**. Here's why:

**Current pain points it solves:**
- Today, admins manually type email + name + department for each team member
- After inviting, they must separately go to Slack settings and run "Auto-Link" to map Slack ↔ Grattia profiles
- If emails don't match (e.g. `john+work@` vs `john@`), manual linking is needed per user
- The `/grattia` slash command only works for linked users, creating friction

**With this feature:**
- Admin connects Slack → selects channel → sees all workspace members in a list
- Selects who to invite → they're created in Grattia **and** auto-linked to Slack in one step
- Zero email mismatch issues because the `slack_user_id` is set at creation time
- Slash command works immediately for all imported users

**Feasibility: Fully possible.** The `slack-auto-link` edge function already fetches all Slack workspace members via `users.list` API. We just need to reuse that data for invitation instead of post-hoc linking.

---

### User Experience Flow

```text
Settings → Notifications → Slack (already connected)
                                    ↓
                          [Import from Slack] button
                                    ↓
                         ┌──────────────────────────┐
                         │  Import Slack Members     │
                         │                           │
                         │  ☐ Jane Smith             │
                         │    jane@company.com       │
                         │    Dept: [Engineering ▾]  │
                         │                           │
                         │  ☐ Bob Jones              │
                         │    bob@company.com        │
                         │    Dept: [Marketing ▾]    │
                         │                           │
                         │  ✓ Alice Lee (already     │
                         │    in Grattia)            │
                         │                           │
                         │  [Import Selected (2)]    │
                         └──────────────────────────┘
```

Also accessible from **Team Management** tab as a secondary "Import from Slack" button alongside the existing "Invite" button.

---

### Technical Plan

#### 1. New edge function: `slack-list-workspace-members`
- Authenticated, admin-only
- Fetches Slack `users.list` (paginated, filters bots/deleted)
- Cross-references with existing `profiles` in the company
- Returns each Slack user with status: `available` (can invite), `already_member` (skip), or `already_linked` (linked but useful info)
- Returns: `{ slack_user_id, name, email, avatar_url, status }`

#### 2. New frontend component: `SlackImportDialog.tsx`
- Multi-select list of available Slack users
- Department selector per user (using existing `NewDepartmentCombobox`)
- Role toggle (member/admin) — defaulting to member
- "Select All" / deselect functionality
- Search/filter within the list
- Shows count of selected users and disabled rows for existing members
- Submit calls a new edge function for bulk creation

#### 3. New edge function: `bulk-invite-from-slack`
- Accepts array of `{ slack_user_id, slack_email, name, department, role }`
- For each user:
  - Creates auth user (or finds existing) — reuses `create-team-member` logic
  - Creates profile with `slack_user_id` pre-set (the key differentiator)
  - Sets status to `invited`, sends invitation email
- Returns summary: `{ created: [...], failed: [...], already_member: [...] }`
- This is essentially the existing `create-team-member` logic in a loop, plus setting `slack_user_id`

#### 4. UI integration points

| Location | Change |
|----------|--------|
| `SlackNotificationsCard.tsx` | Add "Import Team from Slack" button (visible when connected) |
| `TeamManagementHeader.tsx` | Add "Import from Slack" button next to "Invite Member" (when Slack is connected) |
| `SlackUserLinking.tsx` | Add hint text: "You can also import new members directly from Slack" |

#### 5. Update existing `create-team-member` edge function
- Add optional `slack_user_id` parameter
- When provided, set it on the profile during creation
- This keeps backward compatibility with manual email invites

#### 6. No database changes needed
- `profiles.slack_user_id` column already exists
- `profiles` table already has all needed fields
- No new tables required

### Key Design Decisions

- **Bulk operation**: Import multiple users at once rather than one-by-one, since Slack workspaces often have many members
- **Department assignment**: Required per user (matches current invite flow), with a "Set all" bulk option
- **Pre-linked**: `slack_user_id` is written to the profile at creation time — no separate linking step
- **Email handling**: Uses the Slack user's email as the Grattia login email; same invitation email flow as today
- **Existing member detection**: Users already in Grattia (matched by email or `slack_user_id`) are shown as disabled/greyed out

### What This Does NOT Change
- The manual invite flow (email + name) remains unchanged
- CSV bulk upload remains unchanged  
- The existing auto-link and manual-link features remain for users added outside of this flow
- Slash command logic unchanged — it already works with `slack_user_id`

