-- Furkan Saat — product photographs: accept only the names the panel writes.
--
-- 20261026120000_admin_catalog.sql let admins write any name whose first
-- folder is watches/ and whose extension is a photo one in any case: also
-- sub-folders, upper-case names, .jpeg and segments such as "..". The panel
-- writes only watches/<lower-case words joined by dashes>.<webp|jpg|png|avif>
-- (src/lib/admin/imageUpload.ts, STORAGE_OBJECT) and refuses any other address
-- for a watch, so other names could only pile up unused. The upload and
-- rename (update) policies now require the panel's format.
--
-- Nothing else changes: who may list, upload, rename or delete, the bucket and
-- its settings (public, 15 MB, photo types). Objects already in the bucket are
-- not touched. The way back is supabase/rollback/<this name>.down.sql.

alter policy "product-images: admin upload" on storage.objects
  with check (
    bucket_id = 'product-images'
    and name ~ '^watches/[a-z0-9]+(-[a-z0-9]+)*\.(webp|jpg|png|avif)$'
    and (select public.is_admin())
  );

alter policy "product-images: admin update" on storage.objects
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (
    bucket_id = 'product-images'
    and name ~ '^watches/[a-z0-9]+(-[a-z0-9]+)*\.(webp|jpg|png|avif)$'
    and (select public.is_admin())
  );
