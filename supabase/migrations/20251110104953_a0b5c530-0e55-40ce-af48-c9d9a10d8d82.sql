-- Add INSERT policy to allow users to create their own profile
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());