-- Allow the MVP profile/organization runtime to own uploaded assets without
-- depending on legacy creator_profiles rows.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'creator-assets',
    'creator-assets',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'product-images',
    'product-images',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "creator_assets_upload_org_member" on storage.objects;
create policy "creator_assets_upload_org_member" on storage.objects
  for insert with check (
    bucket_id = 'creator-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "creator_assets_update_org_member" on storage.objects;
create policy "creator_assets_update_org_member" on storage.objects
  for update using (
    bucket_id = 'creator-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  ) with check (
    bucket_id = 'creator-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "creator_assets_delete_org_member" on storage.objects;
create policy "creator_assets_delete_org_member" on storage.objects
  for delete using (
    bucket_id = 'creator-assets'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "product_images_upload_org_member" on storage.objects;
create policy "product_images_upload_org_member" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "product_images_update_org_member" on storage.objects;
create policy "product_images_update_org_member" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  ) with check (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "product_images_delete_org_member" on storage.objects;
create policy "product_images_delete_org_member" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] in (
      select organization_id::text
      from public.organization_members
      where user_id = auth.uid()
    )
  );
