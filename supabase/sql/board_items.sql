-- Table: board_items
create table if not exists public.board_items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 200,
  height numeric not null default 120,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Always store the owner on insert.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'board_items'
      and policyname = 'board_items insert is owner'
  ) then
    create policy "board_items insert is owner" on public.board_items
    for insert to authenticated
    with check (auth.uid() = created_by);
  end if;
end;
$$;

-- Everyone logged in can read items.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'board_items'
      and policyname = 'board_items read all'
  ) then
    create policy "board_items read all" on public.board_items
    for select to authenticated
    using (true);
  end if;
end;
$$;

-- Only the owner can update/delete.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'board_items'
      and policyname = 'board_items owner can update'
  ) then
    create policy "board_items owner can update" on public.board_items
    for update to authenticated
    using (auth.uid() = created_by)
    with check (auth.uid() = created_by);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'board_items'
      and policyname = 'board_items owner can delete'
  ) then
    create policy "board_items owner can delete" on public.board_items
    for delete to authenticated
    using (auth.uid() = created_by);
  end if;
end;
$$;

-- Optional: allow collaborative edits by anyone authenticated.
-- Uncomment if you want every logged-in user to move/resize any item.
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_policies
--     where schemaname = 'public'
--       and tablename = 'board_items'
--       and policyname = 'board_items collaborative update'
--   ) then
--     create policy "board_items collaborative update" on public.board_items
--     for update to authenticated
--     using (true)
--     with check (true);
--   end if;
-- end;
-- $$;

-- Keep updated_at fresh.
create or replace function public.set_board_item_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_board_item_updated
before update on public.board_items
for each row execute procedure public.set_board_item_updated_at();
