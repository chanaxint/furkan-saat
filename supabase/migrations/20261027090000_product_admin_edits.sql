-- Furkan Saat — keep "which admin last changed this watch" out of the public
-- catalogue.
--
-- 20261026120000_admin_catalog.sql stored the editor's user id in
-- products.updated_by. products is readable by every visitor (the catalogue is
-- public), so that column let anyone list the admins' user ids. The mark moves
-- to product_admin_edits, which only admins can read, and the column goes.
--
-- Nothing else changes: who may read or write products, the catalogue columns
-- and their values stay as they are. The seed (scripts/products-seed.mjs) reads
-- the mark from the new table. The way back is supabase/rollback/<this name>.down.sql.

create table public.product_admin_edits (
  product_id  uuid primary key references public.products (id) on delete cascade,
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.product_admin_edits enable row level security;

create policy "product admin edits: admin read"
  on public.product_admin_edits for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.product_admin_edits from anon, authenticated;
grant select on public.product_admin_edits to authenticated;

-- Marks made before this migration are kept.
insert into public.product_admin_edits (product_id, updated_by, updated_at)
select id, updated_by, updated_at from public.products where updated_by is not null
on conflict (product_id) do nothing;

-- The card picture still follows the photographs; the editor is no longer written here.
create or replace function public.products_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.image := coalesce(new.front, new.images[1], new.image);
  return new;
end;
$$;

-- An admin's insert or update marks the watch as edited in the panel (the seed
-- then leaves it alone). Only admins: a write made for anyone else (a future
-- stock change during checkout, the seed in the SQL editor) leaves no mark.
create or replace function public.products_mark_admin_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select public.is_admin()) then
    insert into public.product_admin_edits (product_id, updated_by, updated_at)
    values (new.id, auth.uid(), now())
    on conflict (product_id) do update set updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  end if;
  return null;
end;
$$;

create trigger products_mark_admin_edit
  after insert or update on public.products
  for each row execute function public.products_mark_admin_edit();

revoke execute on function public.products_mark_admin_edit() from public, anon, authenticated;

alter table public.products drop column updated_by;
