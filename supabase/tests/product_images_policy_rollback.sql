-- Run by scripts/test-db.sh after supabase/rollback/20261027150000_product_images_policy.down.sql
-- only: the earlier, wider photo rule is back (sub-folders, upper-case
-- extensions, .jpeg) and its limits still hold. Raises on failure.
\set ON_ERROR_STOP on
\set QUIET on

insert into auth.users (id, email) values ('cccccccc-0000-0000-0000-000000000003', 'ayse@example.com');
insert into public.admin_users (user_id, role) values ('cccccccc-0000-0000-0000-000000000003', 'owner');

set role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', false);
insert into storage.objects (bucket_id, name) values
  ('product-images', 'watches/test-saat-1/a1.webp'),
  ('product-images', 'watches/a2.JPG'),
  ('product-images', 'watches/a3.jpeg');
do $$
begin
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'baska/a.webp');
    raise exception 'FAIL: outside watches/ accepted after the rollback';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('product-images', 'watches/kotu.svg');
    raise exception 'FAIL: svg accepted after the rollback';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo ok  rollback restores the earlier photo rule (sub-folders, .JPG, .jpeg accepted; outside watches/ and .svg refused)
