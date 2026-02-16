

# Replace Slack and Microsoft Teams Icons with Actual Brand Logos

## Summary
Replace the generic Lucide `Slack` icon and the hand-drawn `TeamsLogo` SVG with the actual brand logo images you uploaded, so the settings page shows the real Slack and Microsoft Teams logos.

## Changes

### Step 1: Copy uploaded images into the project
- Copy `slack_tile_logo_icon_168820.webp` to `src/assets/slack-logo.webp`
- Copy `Microsoft_Office_Teams_2019–2025_.svg.png` to `src/assets/teams-logo.png`

### Step 2: `src/components/settings/SlackNotificationsCard.tsx`
- Remove the `Slack` import from `lucide-react`
- Import the Slack logo: `import slackLogo from "@/assets/slack-logo.webp"`
- **Line 121**: Replace the `<Slack className="h-5 w-5 text-white" />` icon with `<img src={slackLogo} alt="Slack" className="h-5 w-5 rounded" />`
- **Line 145**: Replace the status indicator `<Slack ... />` with the same `<img>` tag

### Step 3: `src/components/settings/TeamsNotificationsCard.tsx`
- Remove the inline `TeamsLogo` SVG component (lines 27-34 area)
- Import the Teams logo: `import teamsLogo from "@/assets/teams-logo.png"`
- Replace `<TeamsLogo />` usage with `<img src={teamsLogo} alt="Microsoft Teams" className="h-6 w-6" />`

