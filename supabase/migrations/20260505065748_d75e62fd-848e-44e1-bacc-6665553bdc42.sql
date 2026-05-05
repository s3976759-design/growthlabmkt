
insert into storage.buckets (id, name, public) values ('hub', 'hub', true)
on conflict (id) do nothing;

create policy "Public read hub"
on storage.objects for select
using (bucket_id = 'hub');

create policy "Public upload hub"
on storage.objects for insert
with check (bucket_id = 'hub');

create policy "Public delete hub"
on storage.objects for delete
using (bucket_id = 'hub');
