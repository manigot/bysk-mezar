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
create policy if not exists "board_items insert is owner" on public.board_items
for insert to authenticated
with check (auth.uid() = created_by);

-- Everyone logged in can read items.
create policy if not exists "board_items read all" on public.board_items
for select to authenticated
using (true);

-- Only the owner can update/delete.
create policy if not exists "board_items owner can update" on public.board_items
for update to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy if not exists "board_items owner can delete" on public.board_items
for delete to authenticated
using (auth.uid() = created_by);

-- Optional: allow collaborative edits by anyone authenticated.
-- Uncomment if you want every logged-in user to move/resize any item.
-- create policy "board_items collaborative update" on public.board_items
-- for update to authenticated
-- using (true)
-- with check (true);

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
