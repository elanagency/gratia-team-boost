

# Fix: "Failed to setup billing" — Stale Auth Session

## Root Cause

The auth logs reveal the exact problem:

```
"Session not found" - session id (20638350-a6d1-4ff6-b8b2-b0c51f96b902) doesn't exist
```

All three billing attempts returned **401** because the user's auth session is **expired/invalid on the server**, even though it looks valid locally.

Here is what happens step by step:

1. User clicks "Start Subscription"
2. `BillingSetupDialog` calls `getSession()` -- this reads from **local storage** and returns a cached session that appears valid
3. Since a session exists locally, the refresh logic is skipped entirely
4. The edge function is called with this stale token
5. The edge function calls `getUser()` (server-side validation) -- Supabase auth responds "Session not found"
6. Edge function returns 401
7. Frontend shows "Failed to setup billing"

Additionally, the refresh token itself is also invalid (`"Refresh Token Not Found"` in auth logs at 11:39:28), meaning even a refresh attempt would fail.

## Fix: Two Changes

### 1. Use `getUser()` instead of `getSession()` in BillingSetupDialog

Replace the local-only `getSession()` check with a server-validated `getUser()` call. This ensures we detect stale sessions before calling the edge function, and redirect the user to log in again if their session is truly expired.

**File: `src/components/team/BillingSetupDialog.tsx`**

Replace the session check block (lines 37-45) with:

```typescript
// Validate session server-side (getSession only checks local cache)
const { data: { user: validUser }, error: userError } = await supabase.auth.getUser();

if (userError || !validUser) {
  toast.error("Your session has expired. Please log in again.");
  setIsSettingUp(false);
  return;
}
```

### 2. Improve 401 error messaging in BillingSetupDialog

Update the catch block to provide a clearer message and optionally redirect to login, so users don't get stuck clicking "Start Subscription" repeatedly with a dead session.

**File: `src/components/team/BillingSetupDialog.tsx`**

Update the error handling (lines 60-65) to:

```typescript
if (error) {
  if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('403')) {
    toast.error("Your session has expired. Please log in again.");
    // Sign out to clear stale local session
    await supabase.auth.signOut();
    return;
  }
  throw error;
}
```

## Summary

| File | Change |
|------|--------|
| `src/components/team/BillingSetupDialog.tsx` | Replace `getSession()` with `getUser()` for server-side validation; improve 401/403 error handling to clear stale sessions |

## Why This Fixes It

- `getSession()` only reads local storage -- it cannot detect server-side session invalidation
- `getUser()` makes a server round-trip to validate the token, catching expired/revoked sessions immediately
- If the session is stale, the user gets a clear "Please log in again" message instead of a generic "Failed to setup billing"
- The `signOut()` call clears the invalid local session, so the next login starts fresh

## Note for the User

The specific user experiencing this issue (Piers Chen) has an invalid session that cannot be recovered. After this fix is deployed, they will see "Your session has expired. Please log in again" and can re-authenticate to proceed with billing setup.

