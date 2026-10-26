-- Undoes supabase/migrations/20261026120000_admin_catalog.sql.
--
-- NOT a migration: the Supabase CLI does not read this folder. Run it by hand,
-- only after taking a backup (pg_dump / supabase db dump). It permanently drops
-- what the admin panel wrote to the new columns, the slug redirects and the
-- audit log. Customer data and the original products columns are kept.
--
-- The product-images bucket and its files are left in place on purpose (photos
-- may still be linked); remove the bucket from the Supabase dashboard when it is
-- empty and no longer needed.

begin;

drop policy if exists "product-images: admin list"   on storage.objects;
drop policy if exists "product-images: admin upload" on storage.objects;
drop policy if exists "product-images: admin update" on storage.objects;
drop policy if exists "product-images: admin delete" on storage.objects;

drop trigger if exists products_audit on public.products;
drop trigger if exists products_remember_slug on public.products;
drop trigger if exists products_before_write on public.products;
drop function if exists public.products_audit();
drop function if exists public.products_remember_slug();
drop function if exists public.products_before_write();

drop table if exists public.admin_audit_log;
drop table if exists public.product_slug_redirects;

drop policy if exists "products: admin read all" on public.products;
drop policy if exists "products: admin insert"   on public.products;
drop policy if exists "products: admin update"   on public.products;

-- Back to the original grants: the catalogue is read-only for clients.
revoke insert, update on public.products from anon, authenticated;

alter table public.products drop constraint if exists products_slug_format;
alter table public.products
  drop column if exists brand_slug,
  drop column if exists images,
  drop column if exists front,
  drop column if exists specs,
  drop column if exists condition,
  drop column if exists availability,
  drop column if exists full_set,
  drop column if exists collections,
  drop column if exists featured,
  drop column if exists added_at,
  drop column if exists tone,
  drop column if exists position,
  drop column if exists updated_by;

drop function if exists public.is_admin();
drop table if exists public.admin_users;

commit;
