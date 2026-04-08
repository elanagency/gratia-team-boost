

# Add Real Emoji Reactions to Recognition Feed (Slack-style)

## Summary
Replace the static mock emoji reactions with a fully functional Slack-style reaction system. Users can click existing reactions to toggle them, and use an emoji picker to add any emoji as a reaction.

## What changes

### 1. New database table: `recognition_reactions`
Create a migration to store reactions:
```sql
create table public.recognition_reactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.point_transactions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(transaction_id, user_id, emoji)
);

alter table public.recognition_reactions enable row level security;

-- Authenticated users in same company can view reactions
create policy "Users can view reactions for their company transactions"
  on public.recognition_reactions for select to authenticated
  using (
    exists (
      select 1 from public.point_transactions pt
      join public.profiles p on p.company_id = pt.company_id
      where pt.id = recognition_reactions.transaction_id
        and p.id = auth.uid()
    )
  );

-- Users can add their own reactions
create policy "Users can add reactions"
  on public.recognition_reactions for insert to authenticated
  with check (user_id = auth.uid());

-- Users can remove their own reactions
create policy "Users can remove own reactions"
  on public.recognition_reactions for delete to authenticated
  using (user_id = auth.uid());
```

### 2. Update `RecognitionFeed.tsx`
- Remove `MOCK_REACTIONS` constant
- Fetch real reactions from `recognition_reactions` table, grouped by emoji with count and whether current user reacted
- **Click existing reaction pill** → toggle (add/remove your reaction for that emoji)
- **Add reaction button** → opens an emoji picker popover (using native emoji picker or a lightweight component) to add any emoji
- Highlight reaction pills the current user has reacted with (e.g. subtle border or different background, similar to Slack's blue outline)
- Optimistically update reaction counts on click

### 3. UI behavior (Slack-style)
- Each reaction pill shows: emoji + count
- Clicking a pill you've already reacted with removes your reaction; clicking one you haven't adds it
- A "+" / smiley-face button at the end opens an emoji picker to add a new emoji type
- Pills the user has reacted to get a highlighted style (e.g. light purple border or a tinted background)

## Technical details

### Files modified
- `src/components/points/RecognitionFeed.tsx` — main logic changes
- New migration SQL for `recognition_reactions` table

### Emoji picker approach
Use a lightweight emoji picker — either the existing emoji picker already used in the composer (if reusable) or a small inline popover with common emojis + search. Will check what's already in the project.

