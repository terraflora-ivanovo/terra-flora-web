-- Public product image bucket + owner-scoped write policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_owner_insert on storage.objects;
create policy product_images_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = t.slug
    )
  );

drop policy if exists product_images_owner_update on storage.objects;
create policy product_images_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = t.slug
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = t.slug
    )
  );

drop policy if exists product_images_owner_delete on storage.objects;
create policy product_images_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.owner_user_id = auth.uid()
        and (storage.foldername(name))[1] = t.slug
    )
  );
