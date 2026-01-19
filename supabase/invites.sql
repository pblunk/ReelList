-- 1. Create list_invites table
create table public.list_invites (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  token text not null unique,
  created_by uuid references auth.users not null default auth.uid(),
  created_at timestamptz default now(),
  constraint unique_list_invite unique (list_id) -- One active invite per list for now (optional, but simplifies)
);

-- 2. Enable RLS
alter table public.list_invites enable row level security;

-- 3. RLS Policies
-- Owners can view their list's invites
create policy "Owners can view invites" on public.list_invites
  for select using (
    exists (
      select 1 from public.lists
      where lists.id = list_invites.list_id
      and lists.owner_id = auth.uid()
    )
  );

-- Owners can create invites for their lists
create policy "Owners can create invites" on public.list_invites
  for insert with check (
    exists (
      select 1 from public.lists
      where lists.id = list_invites.list_id
      and lists.owner_id = auth.uid()
    )
  );

-- Owners can delete (revoke) invites
create policy "Owners can delete invites" on public.list_invites
  for delete using (
    exists (
      select 1 from public.lists
      where lists.id = list_invites.list_id
      and lists.owner_id = auth.uid()
    )
  );

-- 4. Functions

-- Function: Generate Invite Token (Idempotent-ish: returns existing if valid, or makes new one)
-- Actually, simplest to just "create or get".
-- We'll use a random URL-safe string. `encode(gen_random_bytes(12), 'base64')` needs cleanup for URL.
-- Let's use a simple hex or alphanumeric generation. `md5` is easy but long. 
-- Let's just use `gen_random_uuid()` as the token for simplicity and collision avoidance, strictly.
create or replace function public.generate_invite_token(target_list_id uuid)
returns text
language plpgsql security definer
as $$
declare
  existing_token text;
  new_token text;
begin
  -- Check if user owns the list
  if not exists (select 1 from public.lists where id = target_list_id and owner_id = auth.uid()) then
    raise exception 'Access denied';
  end if;

  -- Check for existing token
  select token into existing_token from public.list_invites where list_id = target_list_id limit 1;
  
  if existing_token is not null then
    return existing_token;
  end if;

  -- Generate new token (using UUID for simplicity and uniqueness)
  -- If you want shorter tokens, we could use a substring + random. 
  -- But UUID is safe.
  new_token := gen_random_uuid()::text;

  insert into public.list_invites (list_id, token)
  values (target_list_id, new_token);

  return new_token;
end;
$$;

-- Function: Join List via Invite
-- Returns json with success/fail/list_id
create or replace function public.join_list_via_invite(invite_token text)
returns json
language plpgsql security definer
as $$
declare
  found_list_id uuid;
  found_list_name text;
  share_exists boolean;
  current_user_email text;
begin
  -- Get current user email from jwt
  current_user_email := auth.jwt() ->> 'email';
  
  if current_user_email is null then
     return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Find invite
  select list_id into found_list_id
  from public.list_invites
  where token = invite_token;

  if found_list_id is null then
    return json_build_object('success', false, 'error', 'Invalid or expired token');
  end if;

  -- Get list name for return
  select name into found_list_name from public.lists where id = found_list_id;

  -- Check if already shared/owned
  -- 1. Owner?
  if exists (select 1 from public.lists where id = found_list_id and owner_id = auth.uid()) then
     return json_build_object('success', true, 'list_id', found_list_id, 'list_name', found_list_name, 'message', 'You own this list');
  end if;

  -- 2. Already shared?
  if exists (select 1 from public.list_shares where list_id = found_list_id and user_email = current_user_email) then
     return json_build_object('success', true, 'list_id', found_list_id, 'list_name', found_list_name, 'message', 'Already joined');
  end if;

  -- Add to list_shares
  insert into public.list_shares (list_id, user_email, shared_by)
  select found_list_id, current_user_email, created_by
  from public.list_invites
  where token = invite_token;

  return json_build_object('success', true, 'list_id', found_list_id, 'list_name', found_list_name);
end;
$$;

-- Function: Revoke Invite
create or replace function public.revoke_invite_token(target_list_id uuid)
returns void
language plpgsql security definer
as $$
begin
  -- Verify ownership
  if not exists (select 1 from public.lists where id = target_list_id and owner_id = auth.uid()) then
    raise exception 'Access denied';
  end if;

  delete from public.list_invites where list_id = target_list_id;
end;
$$;
