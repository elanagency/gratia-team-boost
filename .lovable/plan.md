

# Settings — Logo Uploader, Auto-Save Button, Drop Value Colors

## 1. Company Logo → Photo Uploader (replace URL input)

In `src/components/settings/CompanyInformationCard.tsx`:

- Remove the URL `<Input>` and the separate "Upload" button.
- Always show the logo thumbnail (or placeholder) next to a single **"Upload logo"** button (admin only). Clicking it opens a hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml">`.
- On file select:
  - Validate type and size (max 2MB).
  - Upload to existing public `logos` storage bucket at path `{company_id}/logo-{timestamp}.{ext}` via `supabase.storage.from("logos").upload(...)`.
  - Get `publicUrl`, set it into `editData.logo_url` (cache-busted with `?t=${Date.now()}`).
  - Show new thumbnail immediately.
- Also show a small "Remove" (trash) button next to the logo when one exists, which clears `editData.logo_url`.
- No "edit mode" gate for the uploader — clicking Upload directly modifies `editData`. The existing company-name input becomes always-editable too (see #2).

**Storage RLS check**: The `logos` bucket already exists and is public. We'll add a migration to ensure RLS policies allow authenticated company admins to insert/update/delete objects under their own `company_id` prefix (only if not already present).

## 2. Auto-revealing Save button (remove Edit button)

- Remove `isEditing` state entirely.
- Company Name input is always editable (admin only — disabled for non-admins).
- Compare `editData` vs `companyData` on every render → `hasChanges = name or logo_url differ`.
- The button row shows nothing when no changes, and shows **Save Changes** + **Cancel** only when `hasChanges` is true.
- After successful save, `companyData` updates → `hasChanges` becomes false → buttons disappear automatically.

## 3. Remove Color from Company Values

- Drop `ColorSwatches` component, `newValueColor`, `editingValueColor` state, and `COLOR_PRESETS`.
- Remove the colored dot from each value row (just show the value name).
- Edit mode for a value: only the name input + Save/Cancel.
- Add mode: only name input + Add/Cancel.
- Calls to `addValue` and `updateValue` will pass a fixed default color (`#7F2BFE`) so the existing hook signature and DB `color` column (NOT NULL) stay intact — we just stop letting users choose it.

## Files modified
- `src/components/settings/CompanyInformationCard.tsx`
- New migration: ensure `logos` bucket has admin upload/update/delete RLS policies (idempotent — only adds if missing).

## Notes
- Existing memory `Company Values Color Rules` becomes outdated; will update it after implementation to reflect that colors are no longer user-configurable.
- No DB schema changes required for values (color column stays, just hidden in UI).

