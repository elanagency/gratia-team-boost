
# Fix: Onboarding Progress Requires Hard Refresh

## Problem

The onboarding checklist only invalidates its query cache after the billing dialog completes. When a user invites a team member, connects Slack/Teams, or saves celebration settings, the progress stays stale until they manually refresh the page.

## Solution

Add `queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] })` to the `onSuccess` callbacks of every mutation that affects an onboarding step.

## Changes

### 1. `src/components/team/TeamInviteManager.tsx` (Step 2 -- Add Team Members)

After the existing `invalidateQueries` calls (around line 36-38), add:

```ts
queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
```

### 2. `src/hooks/useSlackIntegration.ts` (Step 3 -- Connect Slack)

In the `connectSlack` mutation's `onSuccess` (around line 95) and `disconnectSlack` mutation's `onSuccess` (around line 165), add:

```ts
queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
```

### 3. `src/hooks/useTeamsIntegration.ts` (Step 3 -- Connect Teams)

In the relevant connect and disconnect mutation `onSuccess` callbacks, add:

```ts
queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
```

### 4. `src/components/settings/CelebrationSettingsCard.tsx` (Step 4 -- Celebrations)

In the save mutation's `onSuccess` (around line 199), add:

```ts
queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
```

### 5. `src/pages/admin/SubscriptionSuccess.tsx` (Step 1 -- Upgrade)

After the existing `invalidateQueries` calls (around line 34-36), add:

```ts
queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
```

## What stays the same

- The existing invalidation in `Dashboard.tsx` `handleBillingSetupComplete` remains.
- The `useOnboardingProgress` hook itself is unchanged -- it already has a 30-second `staleTime`, which is fine for background staleness. The key fix is ensuring mutations that complete steps trigger an immediate refetch.
