-- Furkan Saat — administrators, the full catalogue in the database, and the
-- product photograph bucket.
--
-- Additive only: no existing table, column, policy or row is dropped or changed
-- in meaning. Customer tables (profiles, addresses, orders, order_items,
-- favorites) are not touched. The way back is supabase/rollback/<this name>.down.sql.

-- ------------------------------------------------------------------ admins ---
-- Who may manage the shop. Clients can neither read nor write this table (no
-- grants, no policies): the role never lives in user_metadata, which the user
-- can change. Add the first admin in the SQL editor:
--   insert into public.admin_users (user_id, role)
--   select id, 'owner' from auth.users where email = '<the owner''s e-mail>';

create table public.admin_users (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'editor' check (role in ('owner', 'editor')),
  created_at  timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- True when the request's verified user is an admin. Looks only at auth.uid(),
-- so it cannot be asked about anybody else.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------- products ---
-- Everything the storefront shows, so the database can replace products.json.
-- `brand` keeps the brand's display name (create_order copies it into orders);
-- `brand_slug` is the key the site uses. `position` keeps the catalogue order.

alter table public.products
  add column brand_slug    text,
  add column images        text[]  not null default '{}',
  add column front         text,
  add column specs         jsonb   not null default '{}'::jsonb,
  add column condition     text check (condition in ('Yeni', 'Kullanılmamış', 'Mükemmel', 'Çok iyi')),
  add column availability  text check (availability in ('Stokta', 'Rezerve', 'Sipariş üzerine')),
  add column full_set      boolean not null default false,
  add column collections   text[]  not null default '{}',
  add column featured      boolean not null default false,
  add column added_at      date,
  add column tone          text check (tone in ('green', 'deep', 'ivory', 'stone', 'champagne', 'wine')),
  add column position      integer not null default 0,
  add column updated_by    uuid references auth.users (id) on delete set null;

-- Checked for new and changed rows; rows already in a live database are left as they are.
alter table public.products
  add constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$') not valid;

-- `image` (the picture create_order snapshots) follows the card picture, and
-- `updated_by` is always the verified editor, never a value sent by the client.
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

create trigger products_before_write
  before insert or update on public.products
  for each row execute function public.products_before_write();

-- Admins also see retired pieces, and write. There is no delete: a piece is
-- retired with is_active = false, so customers' favourites (on delete cascade)
-- and past order lines keep their product.
create policy "products: admin read all"
  on public.products for select
  to authenticated
  using ((select public.is_admin()));

create policy "products: admin insert"
  on public.products for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "products: admin update"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Column grants: id, created_at, updated_at and updated_by stay out of reach.
-- RLS above decides who may use them (admins only).
grant insert (slug, name, brand, brand_slug, model, reference, description, price, currency, image,
              images, front, specs, condition, availability, full_set, collections, featured, added_at,
              tone, position, stock, is_active)
  on public.products to authenticated;
grant update (slug, name, brand, brand_slug, model, reference, description, price, currency, image,
              images, front, specs, condition, availability, full_set, collections, featured, added_at,
              tone, position, stock, is_active)
  on public.products to authenticated;

-- ------------------------------------------------------ slug redirects ---
-- When a watch's address changes, /saat/<old> keeps leading to it.

create table public.product_slug_redirects (
  old_slug    text primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.product_slug_redirects enable row level security;

create policy "slug redirects: public read"
  on public.product_slug_redirects for select
  to anon, authenticated
  using (true);

revoke all on public.product_slug_redirects from anon, authenticated;
grant select on public.product_slug_redirects to anon, authenticated;

create or replace function public.products_remember_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    insert into public.product_slug_redirects (old_slug, product_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update set product_id = excluded.product_id;
  end if;
  -- An address in use again belongs to its watch, not to an old redirect.
  delete from public.product_slug_redirects where old_slug = new.slug;
  return null;
end;
$$;

create trigger products_remember_slug
  after insert or update of slug on public.products
  for each row execute function public.products_remember_slug();

-- ----------------------------------------------------------- audit log ---
-- Every product change with the row before and after: who did what, and a way
-- to put a single watch back as it was.

create table public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid,
  table_name  text not null,
  row_id      uuid,
  action      text not null,
  before      jsonb,
  after       jsonb,
  at          timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "audit log: admin read"
  on public.admin_audit_log for select
  to authenticated
  using ((select public.is_admin()));

revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create or replace function public.products_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log (actor, table_name, row_id, action, before, after)
  values (auth.uid(), 'products', new.id, lower(tg_op),
          case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return null;
end;
$$;

create trigger products_audit
  after insert or update on public.products
  for each row execute function public.products_audit();

-- -------------------------------------------------------------- storage ---
-- Watch photographs: anyone may view a file by its public address; only admins
-- upload, replace or remove, and only images under watches/. File type and
-- size limits are enforced by Supabase Storage from the bucket settings.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 15728640,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do nothing;

create policy "product-images: admin list"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: admin upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'watches'
    and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png', 'avif')
    and (select public.is_admin())
  );

create policy "product-images: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'watches'
    and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png', 'avif')
    and (select public.is_admin())
  );

create policy "product-images: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

-- Trigger functions are not callable by clients.
revoke execute on function public.products_before_write() from public, anon, authenticated;
revoke execute on function public.products_remember_slug() from public, anon, authenticated;
revoke execute on function public.products_audit() from public, anon, authenticated;
