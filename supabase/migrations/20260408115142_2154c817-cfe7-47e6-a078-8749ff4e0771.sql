
create table public.recognition_reactions (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.point_transactions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(transaction_id, user_id, emoji)
);

alter table public.recognition_reactions enable row level security;

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

create policy "Users can add reactions"
  on public.recognition_reactions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can remove own reactions"
  on public.recognition_reactions for delete to authenticated
  using (user_id = auth.uid());
