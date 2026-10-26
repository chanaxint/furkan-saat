-- Undoes supabase/migrations/20261027090000_product_admin_edits.sql: the
-- editor's id goes back into products.updated_by (readable by every visitor
-- again) and product_admin_edits is dropped.
--
-- NOT a migration: the Supabase CLI does not read this folder. Run it by hand,
-- after a backup, and before 20261026120000_admin_catalog.down.sql if both are
-- undone. Afterwards, regenerate the seed from the matching commit: the current
-- seed reads product_admin_edits.

begin;

alter table public.products add column if not exists updated_by uuid references auth.users (id) on delete set null;
update public.products p set updated_by = e.updated_by
  from public.product_admin_edits e where e.product_id = p.id;

drop trigger if exists products_mark_admin_edit on public.products;
drop function if exists public.products_mark_admin_edit();

create or replace function public.products_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.image := coalesce(new.front, new.images[1], new.image);
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop table if exists public.product_admin_edits;

commit;
