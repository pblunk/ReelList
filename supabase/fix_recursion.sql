-- Fix infinite recursion by using a security definer function for ownership checks

-- 1. Create helper function to check ownership without triggering RLS recursively
create or replace function public.is_list_owner(check_list_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.lists
    where id = check_list_id
    and owner_id = auth.uid()
  );
$$;

-- 2. Drop the problematic policies on list_shares
drop policy if exists "Owners can view shares" on public.list_shares;
drop policy if exists "Owners can insert shares" on public.list_shares;
drop policy if exists "Owners can delete shares" on public.list_shares;

-- 3. Re-create them using the function
create policy "Owners can view shares" on public.list_shares
  for select using ( public.is_list_owner(list_id) );

create policy "Owners can insert shares" on public.list_shares
  for insert with check ( public.is_list_owner(list_id) );

create policy "Owners can delete shares" on public.list_shares
  for delete using ( public.is_list_owner(list_id) );
