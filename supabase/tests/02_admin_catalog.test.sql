-- Admin, catalogue and photo-bucket tests: an admin (Ayşe), a customer (Can)
-- and an anonymous visitor try to manage products and photographs. Every check
-- raises on failure. Run with scripts/test-db.sh (plain PostgreSQL +
-- 00_supabase_stub.sql), on a fresh database of its own.
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
  ('cccccccc-0000-0000-0000-000000000003', 'ayse@example.com', '{"first_name":"Ayşe","last_name":"Yılmaz"}'),
  ('dddddddd-0000-0000-0000-000000000004', 'can@example.com',  '{"first_name":"Can","last_name":"Demir","role":"admin"}');
insert into public.admin_users (user_id, role) values ('cccccccc-0000-0000-0000-000000000003', 'owner');
insert into storage.buckets (id, name) values ('other', 'other');

select test.ok(
  (select bool_and(relrowsecurity) from pg_class
    where oid in ('public.admin_users'::regclass, 'public.product_slug_redirects'::regclass,
                  'public.admin_audit_log'::regclass, 'public.products'::regclass)),
  'RLS is enabled on the new tables');
select test.ok(
  (select public and file_size_limit = 15728640
          and allowed_mime_types @> array['image/webp','image/jpeg','image/png','image/avif']
          and cardinality(allowed_mime_types) = 4
     from storage.buckets where id = 'product-images'),
  'product-images: public read, 15 MB, images only');
select test.ok((select count(*) from public.products) = 106, 'the seeded catalogue is intact (106 watches)');
select test.ok((select count(*) from public.products where not (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')) = 0,
  'every seeded slug already has the strict format');

-- Can's favourite and order, written as Can (as before this migration).
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000004","role":"authenticated"}', false);
insert into public.favorites (product_id) select id from public.products where slug = 'casio-edifice-efb-730d-3av';
select public.create_order('[{"slug":"casio-edifice-efb-730d-3av","quantity":1}]'::jsonb, null);
select test.ok(test.rows('select * from public.orders') = 1, 'customers still place orders');
reset role;

-- --------------------------------------------------------------- visitor ---
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select test.fails('select * from public.admin_users', 'a visitor cannot read the admin list');
select test.fails('select public.is_admin()', 'a visitor cannot call is_admin');
select test.fails('select * from public.admin_audit_log', 'a visitor cannot read the audit log');
select test.fails($$update public.products set price = 1$$, 'a visitor cannot change prices');
select test.fails($$insert into public.products (slug, name, brand, model) values ('x', 'x', 'x', 'x')$$, 'a visitor cannot add products');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/x.webp')$$, 'a visitor cannot upload photographs');
select test.ok(test.rows($$select * from storage.objects where bucket_id = 'product-images'$$) = 0, 'a visitor cannot list the bucket');
select test.ok(test.rows('select * from public.products') = 106, 'a visitor reads the catalogue');
select test.fails('select * from public.product_admin_edits', 'a visitor cannot read who edited a watch');
reset role;

-- -------------------------------------------------------------- customer ---
set role authenticated;
-- The JWT carries "admin" in every place a user could put it: none of it counts.
select set_config('request.jwt.claims',
  '{"sub":"dddddddd-0000-0000-0000-000000000004","role":"authenticated","user_metadata":{"role":"admin"},"app_metadata":{"role":"admin"}}', false);

select test.ok(public.is_admin() = false, 'a customer is not an admin (role in user_metadata is ignored)');
select test.fails('select * from public.admin_users', 'a customer cannot read the admin list');
select test.fails($$insert into public.admin_users (user_id, role) values (auth.uid(), 'owner')$$, 'a customer cannot make herself an admin');
select test.fails($$update public.admin_users set role = 'owner'$$, 'a customer cannot change admin roles');
select test.ok(test.rows($$update public.products set price = 1 where slug = 'casio-edifice-efb-730d-3av' returning 1$$) = 0,
  'a customer cannot change prices');
select test.fails($$insert into public.products (slug, name, brand, model) values ('sahte-saat', 'x', 'x', 'x')$$, 'a customer cannot add products');
select test.fails($$delete from public.products$$, 'a customer cannot delete products');
select test.ok(test.rows('select * from public.admin_audit_log') = 0, 'a customer cannot read the audit log');
select test.ok(test.rows('select * from public.product_admin_edits') = 0, 'a customer cannot read who edited a watch');
select test.fails($$insert into public.admin_audit_log (table_name, action) values ('products', 'update')$$, 'a customer cannot write the audit log');
select test.fails($$insert into public.product_slug_redirects (old_slug, product_id) select 'sahte', id from public.products limit 1$$,
  'a customer cannot add slug redirects');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/x.webp')$$, 'a customer cannot upload photographs');
select test.ok(test.rows($$select * from storage.objects where bucket_id = 'product-images'$$) = 0, 'a customer cannot list the bucket');
select test.fails($$select public.products_before_write()$$, 'trigger functions are not callable (before write)');
select test.fails($$select public.products_remember_slug()$$, 'trigger functions are not callable (slug)');
select test.fails($$select public.products_audit()$$, 'trigger functions are not callable (audit)');
reset role;

-- A signed-in request without a user id is not an admin either.
set role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', false);
select test.ok(public.is_admin() = false, 'no user id, not an admin');
reset role;

-- ----------------------------------------------------------------- admin ---
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', false);

select test.ok(public.is_admin(), 'the admin is recognised');
select test.fails('select * from public.admin_users', 'even an admin reads the admin list only through is_admin');

-- Prices and fields.
select test.ok(test.rows($$update public.products set price = 12345.67 where slug = 'casio-edifice-efb-730d-3av' returning 1$$) = 1,
  'the admin changes a price');
select test.ok((select e.updated_by from public.product_admin_edits e join public.products p on p.id = e.product_id
                 where p.slug = 'casio-edifice-efb-730d-3av') = 'cccccccc-0000-0000-0000-000000000003',
  'the edit is marked with the verified admin');
select test.fails($$insert into public.product_admin_edits (product_id, updated_by)
  select id, 'dddddddd-0000-0000-0000-000000000004' from public.products where slug = 'casio-edifice-efr-s108de-3av'$$,
  'the edit mark cannot be written by hand');
select test.fails($$update public.product_admin_edits set updated_by = 'dddddddd-0000-0000-0000-000000000004'$$, 'the edit mark cannot be forged');
select test.fails($$update public.products set id = gen_random_uuid() where slug = 'casio-edifice-efb-730d-3av'$$, 'a product id cannot be changed');
select test.fails($$update public.products set created_at = now()$$, 'created_at cannot be changed');
select test.fails($$delete from public.products where slug = 'casio-edifice-efb-730d-3av'$$, 'even an admin cannot delete a product (it is retired instead)');

-- A new watch.
insert into public.products (slug, name, brand, brand_slug, model, price, currency, images, front, specs,
                             condition, availability, collections, added_at, tone, position)
values ('test-saat-1', 'Casio Test', 'Casio', 'casio', 'Test', 1000, 'TRY',
        array['/assets/images/watches/test-1.webp', '/assets/images/watches/test-2.webp'], null,
        '{"movement":"Kuvars","caseMaterial":"Çelik"}', 'Yeni', 'Stokta', array['klasik'], '2026-10-26', 'deep', 0);
select test.ok((select image from public.products where slug = 'test-saat-1') = '/assets/images/watches/test-1.webp',
  'image follows the first photograph');
update public.products set front = '/assets/images/watches/front/test.webp' where slug = 'test-saat-1';
select test.ok((select image from public.products where slug = 'test-saat-1') = '/assets/images/watches/front/test.webp',
  'image follows the head-on picture when there is one');
select test.fails($$insert into public.products (id, slug, name, brand, model) values (gen_random_uuid(), 'test-saat-2', 'x', 'x', 'x')$$,
  'a product id cannot be chosen by the client');
select test.fails($$insert into public.products (slug, name, brand, model) values ('Kötü Adres', 'x', 'x', 'x')$$, 'an invalid slug is rejected');
select test.fails($$update public.products set tone = 'pink' where slug = 'test-saat-1'$$, 'an unknown tone is rejected');
select test.fails($$update public.products set availability = 'Belki' where slug = 'test-saat-1'$$, 'an unknown availability is rejected');
select test.fails($$update public.products set price = -1 where slug = 'test-saat-1'$$, 'a negative price is rejected');
select test.ok(test.rows($$update public.products set price = null where slug = 'test-saat-1' returning 1$$) = 1,
  'price on request (null) stays possible');

-- Slug changes keep the old address working.
update public.products set slug = 'test-saat-yeni' where slug = 'test-saat-1';
select test.ok((select p.slug from public.product_slug_redirects r join public.products p on p.id = r.product_id
                 where r.old_slug = 'test-saat-1') = 'test-saat-yeni', 'a renamed watch leaves a redirect from its old address');
update public.products set slug = 'test-saat-1' where slug = 'test-saat-yeni';
select test.ok(not exists (select 1 from public.product_slug_redirects where old_slug = 'test-saat-1'),
  'an address in use again is no longer a redirect');
select test.ok(exists (select 1 from public.product_slug_redirects where old_slug = 'test-saat-yeni'),
  'the address it moved away from now redirects back');

-- Retiring a watch.
update public.products set is_active = false where slug = 'casio-edifice-efb-730d-3av';
select test.ok(test.rows($$select * from public.products where slug = 'casio-edifice-efb-730d-3av'$$) = 1, 'the admin still sees a retired watch');

-- Audit log.
select test.ok(test.rows($$select * from public.admin_audit_log where actor = auth.uid()$$) >= 5, 'the admin''s changes are in the audit log');
select test.ok(
  (select (before ->> 'price')::numeric is distinct from (after ->> 'price')::numeric
     from public.admin_audit_log where actor = auth.uid() and action = 'update'
      and after ->> 'slug' = 'casio-edifice-efb-730d-3av' order by id limit 1),
  'the audit log keeps the row before and after');
select test.fails($$update public.admin_audit_log set actor = null$$, 'the audit log cannot be rewritten');
select test.fails($$delete from public.admin_audit_log$$, 'the audit log cannot be deleted');

-- Photographs.
select test.ok(test.rows($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/test-saat-1/a1.webp') returning 1$$) = 1,
  'the admin uploads a photograph under watches/');
select test.ok(test.rows($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/test-saat-1/a2.JPG') returning 1$$) = 1,
  'upper-case extensions are accepted');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'baska/a.webp')$$, 'uploads outside watches/ are rejected');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'a.webp')$$, 'uploads at the bucket root are rejected');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/x/kotu.svg')$$, 'non-photo extensions are rejected');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/x/kotu.html')$$, 'html files are rejected');
select test.fails($$insert into storage.objects (bucket_id, name) values ('other', 'watches/a.webp')$$, 'admins cannot write to other buckets');
select test.ok(test.rows($$select * from storage.objects where bucket_id = 'product-images'$$) = 2, 'the admin lists the bucket');
select test.ok(test.rows($$update storage.objects set name = 'watches/test-saat-1/b1.webp' where name = 'watches/test-saat-1/a1.webp' returning 1$$) = 1,
  'the admin renames a photograph');
select test.fails($$update storage.objects set name = 'disari/b1.webp' where name = 'watches/test-saat-1/b1.webp'$$, 'a photograph cannot be moved out of watches/');
select test.ok(test.rows($$delete from storage.objects where name = 'watches/test-saat-1/a2.JPG' returning 1$$) = 1, 'the admin removes a photograph');
reset role;

-- ---------------------------------------- after the admin's changes ---
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select test.ok(test.rows($$select * from public.products where slug = 'casio-edifice-efb-730d-3av'$$) = 0, 'a visitor no longer sees a retired watch');
select test.ok(test.rows($$select * from public.product_slug_redirects where old_slug = 'test-saat-yeni'$$) = 1, 'a visitor can follow slug redirects');
select test.ok(not exists (select 1 from (select to_jsonb(p) as r from public.products p) x
                            where r::text like '%cccccccc-0000-0000-0000-000000000003%'),
  'nothing a visitor reads in the catalogue names the admin');
reset role;

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000004","role":"authenticated"}', false);
select test.ok(test.rows('select * from public.favorites') = 1, 'retiring a watch keeps the customer''s favourite');
select test.ok(test.rows('select * from public.order_items') = 1, 'retiring a watch keeps the customer''s order line');
select test.ok(test.rows($$select * from storage.objects where bucket_id = 'product-images'$$) = 0, 'the customer still cannot list the bucket');
select test.ok(test.rows($$delete from storage.objects where bucket_id = 'product-images' returning 1$$) = 0, 'a customer cannot remove photographs');
reset role;

-- -------------------------------------------------------- admin removed ---
delete from public.admin_users where user_id = 'cccccccc-0000-0000-0000-000000000003';
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', false);
select test.ok(public.is_admin() = false, 'a removed admin loses access at once (no token wait)');
select test.ok(test.rows($$update public.products set price = 1 where slug = 'test-saat-1' returning 1$$) = 0, 'a removed admin cannot change prices');
select test.fails($$insert into storage.objects (bucket_id, name) values ('product-images', 'watches/z.webp')$$, 'a removed admin cannot upload');
reset role;

\echo ALL ADMIN CATALOG TESTS PASSED
