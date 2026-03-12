

## Add Avatar Upload & Display

### Overview
Allow users to upload a profile photo from the top-right user menu. The avatar replaces the initials circle everywhere it appears: top navigation, recognition feed, team member lists, and the profile settings page.

### How It Works

1. **Supabase Storage bucket** — Create an `avatars` bucket (public) to store uploaded images.

2. **Auth context carries `avatarUrl`** — Add `avatar_url` to the `useOptimizedAuth` profile query and expose it through `AuthContext`. This makes the avatar available app-wide without extra fetches.

3. **Avatar upload in user dropdown** — In `DashboardTopNavigation.tsx`, replace the initials circle with an `Avatar` component. Add a clickable overlay or menu item ("Change photo") that opens a file input. On file select:
   - Upload to `avatars/{userId}.{ext}` in Supabase Storage
   - Update `profiles.avatar_url` with the public URL
   - Invalidate the `user-profile` query to refresh everywhere

4. **Profile Settings page** — Add an avatar section at the top of `ProfileSettings.tsx` with a larger preview and upload/remove button.

5. **Update all avatar display points**:
   - `DashboardTopNavigation.tsx` — top-right user circle + dropdown
   - `Header.tsx` / `MemoizedHeader.tsx` — dashboard greeting (if avatar shown there)
   - `RecognitionFeed.tsx` — sender avatars in the feed (already uses `Avatar` component but only `AvatarFallback`)
   - `GivePointsDialog.tsx` — member list avatars
   - `TeamMembersCard.tsx` — already renders `avatar_url` (no change needed)

### Technical Changes

| File | Change |
|------|--------|
| **Migration** | Create `avatars` storage bucket with public access policy |
| `useOptimizedAuth.tsx` | Add `avatar_url` to profile query and `UserProfile` type |
| `AuthContext.tsx` | Add `avatarUrl` to `AuthContextType` |
| `DashboardTopNavigation.tsx` | Use `Avatar`/`AvatarImage`/`AvatarFallback`, add upload trigger |
| `ProfileSettings.tsx` | Add avatar upload section with preview and remove |
| `RecognitionFeed.tsx` | Fetch and display `avatar_url` from sender/recipient profiles |
| `GivePointsDialog.tsx` | Show `avatar_url` in member selection list |

### Storage Policy
- Authenticated users can upload to their own path (`avatars/{uid}/*`)
- Public read access so avatar URLs work everywhere without auth headers

