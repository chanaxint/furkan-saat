-- The catalogue seed (supabase/seed/products.sql, from products.json) on a
-- database that is already in use: customers' favourites and orders, an admin's
-- edits, a product that has left the catalogue. Running the seed again must
-- keep every id, keep that data, and leave the admin's work alone.
-- Run with scripts/test-db.sh, on a fresh database of its own.
\set ON_ERROR_STOP on
\set QUIET on

create schema test;
create function test.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;

-- ------------------------------------------------------ the first seed ---
select test.ok((select count(*) from public.products) = 106, 'the seed writes the 106 watches');
select test.ok((select bool_and(is_active) from public.products), 'all of them are on sale');
select test.ok((select count(distinct position) = 106 and min(position) = 0 and max(position) = 105 from public.products),
  'each has its own place, 0 to 105, in products.json order');
select test.ok((select bool_and(updated_by is null) from public.products), 'seeded rows are not marked as edited by an admin');
select test.ok((select bool_and(image = coalesce(front, images[1])) from public.products), 'the card picture is the head-on photo, else the first');
select test.ok((select count(*) from public.products where price is null) = 71, 'price on request stays null (71 watches)');
select test.ok((select name = 'Casio Edifice Sapphire Kronograf' and brand = 'Casio' and brand_slug = 'casio' and price = 14950.00
                       and currency = 'TRY' and position = 0
                  from public.products where slug = 'casio-edifice-efb-730d-3av'), 'a sample watch is stored as in products.json');
select test.ok((select brand from public.products where brand_slug = 'santa-barbara-polo' limit 1) = 'Santa Barbara Polo & Racquet Club',
  'brand names come from brands.ts');

create table test.ids as select id, slug from public.products;

-- ------------------------------------------- the shop in use, meanwhile ---
insert into auth.users (id, email) values
  ('cccccccc-0000-0000-0000-000000000003', 'ayse@example.com'),
  ('dddddddd-0000-0000-0000-000000000004', 'can@example.com');
insert into public.admin_users (user_id, role) values ('cccccccc-0000-0000-0000-000000000003', 'owner');

-- A watch that has left products.json (added before, by hand, not by an admin).
insert into public.products (slug, name, brand, brand_slug, model, price, currency, images, condition, availability, added_at, tone)
values ('eski-saat', 'Casio Eski', 'Casio', 'casio', 'Eski', 500, 'TRY', array['/assets/images/watches/eski.webp'],
        'Yeni', 'Stokta', '2025-01-01', 'deep');

-- Can's favourites and an order.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000004","role":"authenticated"}', false);
insert into public.favorites (product_id) select id from public.products where slug in ('casio-edifice-efb-730d-3av', 'eski-saat');
create temp table placed as select * from public.create_order('[{"slug":"casio-edifice-efb-730d-3av","quantity":1}]'::jsonb, null);
reset role;

-- The admin changes a price and adds a watch from the panel.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', false);
update public.products set price = 13500 where slug = 'casio-edifice-efr-s108de-3av';
insert into public.products (slug, name, brand, brand_slug, model, price, currency, images, condition, availability, added_at, tone, position)
values ('panelden-yeni-saat', 'Casio Yeni', 'Casio', 'casio', 'Yeni', 900, 'TRY', array['/assets/images/watches/yeni.webp'],
        'Yeni', 'Stokta', '2026-10-26', 'deep', 106);
reset role;

-- Drift outside the panel (no admin): the seed should put it back.
select set_config('request.jwt.claims', '{}', false);
update public.products set name = 'Elle değişmiş ad', price = 1 where slug = 'casio-edifice-efb-730d-3av';

create table test.order_before as
  select oi.product_id, oi.product_name, oi.unit_price, o.total from public.order_items oi join public.orders o on o.id = oi.order_id;

-- ------------------------------------------------------ seed once more ---
\ir ../seed/products.sql

select test.ok((select count(*) from test.ids t join public.products p using (id) where p.slug = t.slug) = 106,
  'every watch keeps its id');
select test.ok((select name = 'Casio Edifice Sapphire Kronograf' and price = 14950.00 from public.products where slug = 'casio-edifice-efb-730d-3av'),
  'changes made outside the panel are put back from products.json');
select test.ok((select price from public.products where slug = 'casio-edifice-efr-s108de-3av') = 13500,
  'an admin''s price change is not overwritten');
select test.ok((select is_active from public.products where slug = 'panelden-yeni-saat'), 'a watch added in the panel stays on sale');
select test.ok((select not is_active from public.products where slug = 'eski-saat'), 'a watch no longer in products.json is retired');
select test.ok(exists (select 1 from public.products where slug = 'eski-saat'), '… but not deleted');
select test.ok((select count(*) from public.favorites where user_id = 'dddddddd-0000-0000-0000-000000000004') = 2,
  'the customer''s favourites are all still there (the retired watch included)');
select test.ok(
  (select count(*) from test.order_before b
     join public.order_items oi on oi.product_id = b.product_id and oi.product_name = b.product_name and oi.unit_price = b.unit_price
     join public.orders o on o.id = oi.order_id and o.total = b.total) = 1,
  'the order and its line are unchanged');

-- ------------------------------------------------ and once more again ---
create table test.snapshot as
  select slug, to_jsonb(p) - 'updated_at' - 'created_at' as row from public.products p;
\ir ../seed/products.sql
select test.ok(
  (select count(*) from test.snapshot s join public.products p using (slug)
    where s.row = to_jsonb(p) - 'updated_at' - 'created_at') = (select count(*) from public.products),
  'running the seed again changes nothing');

\echo ALL CATALOG SEED TESTS PASSED
