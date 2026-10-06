-- =============================================================================
-- Furkan Saat — customer accounts, addresses, products, orders and favourites.
--
-- Identity: Supabase Auth (auth.users). Passwords live only in Supabase Auth,
-- hashed by it; no table here ever stores a password.
-- Every table has Row Level Security on. A signed-in customer can reach only
-- their own rows; the anon role reaches nothing but the public product list.
-- =============================================================================

-- ---------------------------------------------------------------- helpers ---

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- profiles ---

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null default '' check (char_length(first_name) <= 80),
  last_name   text not null default '' check (char_length(last_name) <= 80),
  email       text not null default '' check (char_length(email) <= 320),
  phone       text check (phone is null or char_length(phone) <= 30),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT / DELETE policy: the row is created by the trigger below and
-- removed with the auth user (on delete cascade).
-- The e-mail mirrors auth.users and is changed only through Supabase Auth, so
-- customers may update just their name and phone.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- A profile for every new auth user, from the sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 80),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The profile's e-mail follows the auth user's (after a confirmed change).
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Trigger functions are not callable by clients.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- --------------------------------------------------------------- addresses ---

create table public.addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null default 'Adres' check (char_length(title) between 1 and 60),
  first_name    text not null check (char_length(first_name) between 1 and 80),
  last_name     text not null check (char_length(last_name) between 1 and 80),
  phone         text not null check (char_length(phone) between 7 and 30),
  country       text not null default 'Türkiye' check (char_length(country) between 2 and 60),
  city          text not null check (char_length(city) between 1 and 60),
  district      text not null check (char_length(district) between 1 and 60),
  postal_code   text not null default '' check (char_length(postal_code) <= 12),
  address_line  text not null check (char_length(address_line) between 5 and 300),
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- At most one default address per customer.
create unique index addresses_one_default_idx on public.addresses (user_id) where is_default;

create trigger addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- Choosing a default unsets the previous one; a customer's first address is the default.
-- Runs with the caller's rights, so RLS still limits it to their own rows.
create or replace function public.addresses_keep_one_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and not exists (
    select 1 from public.addresses where user_id = new.user_id
  ) then
    new.is_default := true;
  end if;
  if new.is_default then
    update public.addresses
       set is_default = false
     where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger addresses_one_default
  before insert or update of is_default on public.addresses
  for each row execute function public.addresses_keep_one_default();

-- When the default address is deleted, the newest remaining one takes its place.
create or replace function public.addresses_reassign_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default then
    update public.addresses
       set is_default = true
     where id = (
       select id from public.addresses
        where user_id = old.user_id
        order by created_at desc
        limit 1
     );
  end if;
  return null;
end;
$$;

create trigger addresses_reassign_default
  after delete on public.addresses
  for each row execute function public.addresses_reassign_default();

alter table public.addresses enable row level security;

create policy "addresses: read own"
  on public.addresses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "addresses: insert own"
  on public.addresses for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "addresses: update own"
  on public.addresses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "addresses: delete own"
  on public.addresses for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.addresses from anon, authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

-- ---------------------------------------------------------------- products ---
-- The storefront keeps its catalogue in src/lib/data/products.json (slug is the
-- key). This table mirrors it so favourites and orders can reference a product
-- by id and so order prices are taken from the server, never from the browser.
-- Seed / refresh it with supabase/seed/products.sql (npm run db:products).

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (char_length(slug) between 1 and 120),
  name         text not null,
  brand        text not null,
  model        text not null,
  reference    text not null default '',
  description  text not null default '',
  price        numeric(12, 2) check (price is null or price >= 0),
  currency     text not null default 'TRY' check (currency in ('TRY', 'EUR', 'USD')),
  image        text,
  stock        integer not null default 0 check (stock >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- The catalogue is public; only the service role (server/admin) writes it.
create policy "products: public read"
  on public.products for select
  to anon, authenticated
  using (is_active);

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;

-- ------------------------------------------------------------------ orders ---

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete restrict,
  order_number      text not null unique,
  status            text not null default 'pending_payment'
                    check (status in ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal          numeric(12, 2) not null check (subtotal >= 0),
  shipping_cost     numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  total             numeric(12, 2) not null check (total >= 0),
  currency          text not null default 'TRY' check (currency in ('TRY', 'EUR', 'USD')),
  -- The delivery address as it was when the order was placed.
  shipping_address  jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_user_id_created_idx on public.orders (user_id, created_at desc);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  -- Snapshot of the product at the time of the order.
  product_name   text not null,
  product_image  text,
  quantity       integer not null check (quantity between 1 and 99),
  unit_price     numeric(12, 2) not null check (unit_price >= 0),
  total_price    numeric(12, 2) not null check (total_price >= 0),
  created_at     timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Customers only read their orders. Orders are written by public.create_order
-- (below) or by the server with the service role (payments, shipping updates).
create policy "orders: read own"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "order_items: read own"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
     where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- A readable, unique order number: FS-YYMMDD-XXXXXX.
create or replace function public.new_order_number()
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := 'FS-' || to_char(now() at time zone 'Europe/Istanbul', 'YYMMDD') || '-'
                 || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.orders where order_number = candidate);
  end loop;
  return candidate;
end;
$$;

revoke execute on function public.new_order_number() from public, anon, authenticated;

-- Places an order for the signed-in customer.
--   p_items       [{ "slug": "...", "quantity": 1 }, ...]
--   p_address_id  one of the customer's own saved addresses (null: collect in store)
-- Prices, names and images come from public.products, never from the caller,
-- and are copied into order_items; the address is copied into the order.
-- The order starts as 'pending_payment'; a payment webhook (service role)
-- moves it on.
create or replace function public.create_order(p_items jsonb, p_address_id uuid default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid        uuid := auth.uid();
  addr       public.addresses;
  ord        public.orders;
  item       jsonb;
  prod       public.products;
  qty        integer;
  sub        numeric(12, 2) := 0;
  cur        text;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;

  if p_address_id is not null then
    select * into addr from public.addresses where id = p_address_id and user_id = uid;
    if not found then
      raise exception 'address_not_found' using errcode = '22023';
    end if;
  end if;

  insert into public.orders (user_id, order_number, subtotal, shipping_cost, total, currency, shipping_address)
  values (
    uid, public.new_order_number(), 0, 0, 0, 'TRY',
    case when p_address_id is null then null else jsonb_build_object(
      'title', addr.title, 'first_name', addr.first_name, 'last_name', addr.last_name,
      'phone', addr.phone, 'country', addr.country, 'city', addr.city,
      'district', addr.district, 'postal_code', addr.postal_code,
      'address_line', addr.address_line
    ) end
  )
  returning * into ord;

  for item in select * from jsonb_array_elements(p_items) loop
    qty := coalesce((item ->> 'quantity')::integer, 1);
    if qty < 1 or qty > 10 then
      raise exception 'invalid_quantity' using errcode = '22023';
    end if;
    select * into prod from public.products
     where slug = item ->> 'slug' and is_active and price is not null;
    if not found then
      raise exception 'product_unavailable' using errcode = '22023';
    end if;
    if cur is null then
      cur := prod.currency;
    elsif cur <> prod.currency then
      raise exception 'mixed_currency' using errcode = '22023';
    end if;
    insert into public.order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price)
    values (ord.id, prod.id, prod.name, prod.image, qty, prod.price, prod.price * qty);
    sub := sub + prod.price * qty;
  end loop;

  -- Insured shipping is free today; change here (server side) when it is not.
  update public.orders
     set subtotal = sub, shipping_cost = 0, total = sub, currency = cur
   where id = ord.id
  returning * into ord;
  return ord;
end;
$$;

revoke execute on function public.create_order(jsonb, uuid) from public, anon;
grant execute on function public.create_order(jsonb, uuid) to authenticated;

-- --------------------------------------------------------------- favorites ---

create table public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- The same watch only once per customer.
  constraint favorites_user_product_key unique (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "favorites: read own"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "favorites: insert own"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "favorites: delete own"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- The helpers above are table triggers only.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.addresses_keep_one_default() from public, anon, authenticated;
revoke execute on function public.addresses_reassign_default() from public, anon, authenticated;
