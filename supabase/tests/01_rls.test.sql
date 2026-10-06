-- Row Level Security tests: two customers (Alice, Bob) and an anonymous visitor
-- try to read and change each other's data. Every check raises on failure.
-- Run with scripts/test-db.sh (plain PostgreSQL + 00_supabase_stub.sql).
\set ON_ERROR_STOP on
\set QUIET on

create schema test;
grant usage on schema test to anon, authenticated;

create function test.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;

-- The statement must fail (permission denied, RLS check, constraint...).
create function test.fails(stmt text, what text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok  % (%)', what, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % — statement succeeded: %', what, stmt;
end $$;

-- Number of rows a query returns, or a DML statement (with RETURNING) touches.
create function test.rows(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'with x as (' || stmt || ') select count(*) from x' into n;
  return n;
end $$;

grant execute on all functions in schema test to anon, authenticated;

-- --------------------------------------------------------------- set-up ---
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@example.com', '{"first_name":"Alice","last_name":"Aydın"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@example.com',   '{"first_name":"Bob","last_name":"Bulut"}');

select test.ok((select count(*) from public.profiles) = 2, 'a profile is created for each new auth user');
select test.ok((select first_name from public.profiles where email = 'alice@example.com') = 'Alice', 'profile takes the sign-up name');

select test.ok(
  (select bool_and(relrowsecurity) from pg_class
    where oid in ('public.profiles'::regclass, 'public.addresses'::regclass, 'public.products'::regclass,
                  'public.orders'::regclass, 'public.order_items'::regclass, 'public.favorites'::regclass)),
  'RLS is enabled on every table');

-- Bob's data, written as Bob.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', false);
insert into public.addresses (title, first_name, last_name, phone, city, district, address_line)
  values ('Ev', 'Bob', 'Bulut', '+90 532 000 00 00', 'Nevşehir', 'Merkez', 'Bob Sokak No: 2');
select public.create_order('[{"slug":"casio-edifice-efb-730d-3av","quantity":1}]'::jsonb, null);
insert into public.favorites (product_id) select id from public.products where slug = 'casio-edifice-efb-730d-3av';
reset role;

-- ------------------------------------------------------------- profiles ---
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', false);

select test.ok(test.rows('select * from public.profiles') = 1, 'Alice sees only her own profile');
select test.ok(test.rows($$select * from public.profiles where email = 'bob@example.com'$$) = 0, 'Alice cannot read Bob''s profile');
select test.ok(test.rows($$update public.profiles set first_name = 'Alicia' where id = auth.uid() returning 1$$) = 1, 'Alice updates her own name');
select test.ok(test.rows($$update public.profiles set first_name = 'X' where email = 'bob@example.com' returning 1$$) = 0, 'Alice cannot update Bob''s profile');
select test.fails($$update public.profiles set email = 'hijack@example.com' where id = auth.uid()$$, 'profile e-mail is not writable by the customer');
select test.fails($$update public.profiles set id = 'bbbbbbbb-0000-0000-0000-000000000002' where id = auth.uid()$$, 'profile id is not writable');
select test.fails($$insert into public.profiles (id, email) values (gen_random_uuid(), 'x@example.com')$$, 'customers cannot insert profiles');
select test.fails($$delete from public.profiles where id = auth.uid()$$, 'customers cannot delete profiles');

-- ------------------------------------------------------------ addresses ---
insert into public.addresses (title, first_name, last_name, phone, city, district, address_line)
  values ('Ev', 'Alice', 'Aydın', '+90 532 111 11 11', 'Nevşehir', 'Merkez', 'Alice Caddesi No: 1');
select test.ok((select is_default from public.addresses where title = 'Ev'), 'the first address becomes the default');
insert into public.addresses (title, first_name, last_name, phone, city, district, address_line, is_default)
  values ('Ofis', 'Alice', 'Aydın', '+90 532 111 11 11', 'Kayseri', 'Melikgazi', 'Ofis Bulvarı No: 10', true);
select test.ok((select count(*) from public.addresses where is_default) = 1 and (select is_default from public.addresses where title = 'Ofis'),
  'choosing a new default leaves exactly one default');
select test.ok(test.rows('select * from public.addresses') = 2, 'Alice sees only her own two addresses');
select test.fails($$insert into public.addresses (user_id, title, first_name, last_name, phone, city, district, address_line)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'Sahte', 'A', 'B', '+90 532 000 00 00', 'X', 'Y', 'Sahte adres 123')$$,
  'Alice cannot add an address to Bob''s account');
select test.ok(test.rows($$update public.addresses set city = 'X' where user_id = 'bbbbbbbb-0000-0000-0000-000000000002' returning 1$$) = 0, 'Alice cannot edit Bob''s address');
select test.ok(test.rows($$delete from public.addresses where user_id = 'bbbbbbbb-0000-0000-0000-000000000002' returning 1$$) = 0, 'Alice cannot delete Bob''s address');
select test.fails($$update public.addresses set user_id = 'bbbbbbbb-0000-0000-0000-000000000002' where title = 'Ev'$$, 'Alice cannot move her address to Bob');
delete from public.addresses where title = 'Ofis';
select test.ok((select is_default from public.addresses where title = 'Ev'), 'deleting the default makes another address the default');
select test.fails($$insert into public.addresses (title, first_name, last_name, phone, city, district, address_line)
  values ('Ev', '', 'A', '1', 'X', 'Y', 'kısa')$$, 'invalid address values are rejected');

-- --------------------------------------------------------------- orders ---
select test.ok(test.rows('select * from public.orders') = 0, 'Alice cannot see Bob''s order');
select test.ok(test.rows('select * from public.order_items') = 0, 'Alice cannot see Bob''s order items');
select test.fails($$insert into public.orders (user_id, order_number, subtotal, total) values (auth.uid(), 'FS-FAKE', 0, 0)$$, 'customers cannot write orders directly');
select test.fails($$insert into public.order_items (order_id, product_name, quantity, unit_price, total_price)
  select id, 'x', 1, 0, 0 from public.orders limit 1$$, 'customers cannot write order items directly');

-- Placing an order: the price comes from the products table, not the request.
create temp table placed as
  select * from public.create_order(
    '[{"slug":"casio-edifice-efb-730d-3av","quantity":2,"price":1}]'::jsonb,
    (select id from public.addresses where title = 'Ev'));
select test.ok((select total from placed) = 2 * (select price from public.products where slug = 'casio-edifice-efb-730d-3av'),
  'order total is computed on the server (a forged price is ignored)');
select test.ok((select order_number ~ '^FS-\d{6}-[0-9A-F]{6}$' from placed), 'order number is FS-YYMMDD-XXXXXX');
select test.ok((select shipping_address ->> 'address_line' from placed) = 'Alice Caddesi No: 1', 'shipping address is copied into the order');
select test.ok(test.rows('select * from public.order_items') = 1, 'Alice sees her own order item');
select test.fails($$update public.orders set status = 'delivered', total = 0$$, 'customers cannot change an order');
select test.fails($$delete from public.orders$$, 'customers cannot delete an order');
select test.fails($$select public.create_order('[{"slug":"casio-edifice-efb-730d-3av"}]'::jsonb,
  (select id from public.addresses where false union all select 'ffffffff-0000-0000-0000-000000000000'::uuid limit 1))$$,
  'an order cannot use an address that is not hers');
select test.fails($$select public.create_order('[{"slug":"yok-boyle-bir-saat"}]'::jsonb, null)$$, 'an unknown product cannot be ordered');
select test.fails($$select public.create_order('[{"slug":"casio-edifice-efb-730d-3av","quantity":500}]'::jsonb, null)$$, 'quantities are bounded');

-- ------------------------------------------------------------ favorites ---
insert into public.favorites (product_id) select id from public.products where slug = 'casio-edifice-efb-730d-3av';
select test.fails($$insert into public.favorites (product_id) select id from public.products where slug = 'casio-edifice-efb-730d-3av'$$,
  'the same watch cannot be saved twice');
select test.fails($$insert into public.favorites (user_id, product_id)
  select 'bbbbbbbb-0000-0000-0000-000000000002', id from public.products where slug = 'casio-edifice-efr-s108de-3av'$$,
  'Alice cannot add a favourite to Bob''s account');
select test.ok(test.rows('select * from public.favorites') = 1, 'Alice sees only her own favourite');
select test.ok(test.rows($$delete from public.favorites where user_id = 'bbbbbbbb-0000-0000-0000-000000000002' returning 1$$) = 0, 'Alice cannot delete Bob''s favourite');
select test.fails($$update public.favorites set user_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 'favourites cannot be reassigned');

-- ------------------------------------------------------------- products ---
select test.fails($$update public.products set price = 1$$, 'customers cannot change prices');
select test.fails($$insert into public.products (slug, name, brand, model) values ('x', 'x', 'x', 'x')$$, 'customers cannot add products');

-- -------------------------------------------------------------- helpers ---
select test.fails($$select public.new_order_number()$$, 'internal helpers are not callable');
select test.fails($$select public.set_updated_at()$$, 'trigger functions are not callable');
reset role;

-- ------------------------------------------------- Bob looks at Alice ---
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', false);
select test.ok(test.rows('select * from public.orders') = 1, 'Bob sees only his own order');
select test.ok(test.rows($$select * from public.addresses where address_line like 'Alice%'$$) = 0, 'Bob cannot read Alice''s address');
select test.ok(test.rows('select * from public.favorites') = 1, 'Bob sees only his own favourite');
reset role;

-- -------------------------------------------------------------- visitor ---
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select test.fails('select * from public.profiles', 'a visitor cannot read profiles');
select test.fails('select * from public.addresses', 'a visitor cannot read addresses');
select test.fails('select * from public.orders', 'a visitor cannot read orders');
select test.fails('select * from public.order_items', 'a visitor cannot read order items');
select test.fails('select * from public.favorites', 'a visitor cannot read favourites');
select test.fails($$select public.create_order('[{"slug":"casio-edifice-efb-730d-3av"}]'::jsonb, null)$$, 'a visitor cannot place an order');
select test.ok(test.rows('select * from public.products') > 0, 'a visitor can read the product list');
reset role;

-- A signed-in request without a user id (forged role) still gets nothing.
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', false);
select test.ok(test.rows('select * from public.profiles') = 0 and test.rows('select * from public.addresses') = 0, 'no user id, no rows');
select test.fails($$select public.create_order('[{"slug":"casio-edifice-efb-730d-3av"}]'::jsonb, null)$$, 'no user id, no order');
reset role;

-- ------------------------------------------------------------- snapshot ---
update public.products set price = price * 3, name = 'Yeni ad' where slug = 'casio-edifice-efb-730d-3av';
select test.ok(
  (select bool_and(oi.product_name <> 'Yeni ad' and oi.unit_price < p.price)
     from public.order_items oi join public.products p on p.id = oi.product_id),
  'a later price or name change does not alter past orders');

update auth.users set email = 'alice.new@example.com' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select test.ok((select email from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'alice.new@example.com',
  'a changed auth e-mail is mirrored to the profile');

-- Orders are kept as records: a customer with orders is not deleted along with them.
select test.fails($$delete from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 'a customer with orders cannot be silently deleted');

\echo ALL RLS TESTS PASSED
