-- Undoes supabase/migrations/20261027150000_product_images_policy.sql: the
-- upload and rename policies of product-images go back to the earlier rule
-- (first folder watches/, a photo extension in any case).
--
-- NOT a migration: the Supabase CLI does not read this folder. Run it by hand,
-- before the older rollback files if those are undone too. Objects are not
-- touched.

begin;

alter policy "product-images: admin upload" on storage.objects
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'watches'
    and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png', 'avif')
    and (select public.is_admin())
  );

alter policy "product-images: admin update" on storage.objects
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'watches'
    and lower(storage.extension(name)) in ('webp', 'jpg', 'jpeg', 'png', 'avif')
    and (select public.is_admin())
  );

commit;
