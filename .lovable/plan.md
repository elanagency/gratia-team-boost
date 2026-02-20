
# Fix: create-team-member Edge Function Failing for Existing Users

## Problem

The `create-team-member` edge function uses `listUsers()` (line 190) to check if a user already exists. This call has a default pagination limit (~50 users), so it may miss users beyond the first page. When it misses an existing user, it attempts `createUser()` which fails with `email_exists` (HTTP 422), and the function returns a 500 error: "Failed to create user account".

The CSV preview worked correctly (start dates loaded fine), but all 3 users failed during the processing step because of this existing-user detection bug.

## Solution

Replace `listUsers()` with a targeted email lookup. The Supabase admin API does not have `getUserByEmail()` directly, but we can use `listUsers()` with a filter, or better yet, query the auth schema. The most reliable approach is to attempt `createUser()` first and handle the `email_exists` error gracefully by looking up the existing user.

## Changes

### `supabase/functions/create-team-member/index.ts`

Replace the user existence check logic (lines 189-230) with a "try to create, handle conflict" pattern:

**Before (current broken logic):**
```ts
// Check if user already exists
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const userExists = existingUsers.users.some(user => 
  user.email?.toLowerCase() === email.toLowerCase()
);
// ... then branch on userExists
```

**After (robust logic):**
```ts
let userId: string;
let isNewUser = false;
let password: string | undefined;

// First, try to find user by listing with a filter or attempt creation
// Try creating the user first - if they exist, handle the error
password = generateSecurePassword();
const { firstName, lastName } = parseFullName(name);

const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { firstName, lastName },
});

if (createUserError) {
  if (createUserError.message?.includes('already been registered') || 
      (createUserError as any).code === 'email_exists') {
    // User exists - find them by listing with per_page:1 filter workaround
    // Use listUsers with a small page and filter
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = allUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existingUser?.id) {
      return error response;
    }
    userId = existingUser.id;
    isNewUser = false;
    password = undefined; // Don't send password for existing users
  } else {
    return error response;
  }
} else {
  userId = newUser.user.id;
  isNewUser = true;
}
```

This approach:
1. Attempts to create the user first (the happy path for genuinely new users)
2. If creation fails with `email_exists`, catches that specific error and finds the existing user
3. Uses `perPage: 1000` to increase the pagination limit when we do need to search
4. Eliminates the race condition where the initial check passes but creation fails

## What stays the same

- All the profile upsert logic
- Email sending logic
- Department handling
- The CSV parsing and preview on the frontend
- The billing/subscription checks
