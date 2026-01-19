-- Create tables and RLS policies for ReelList

-- 1. Lists Table
create table public.lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.lists enable row level security;

-- Policy: Users can see lists they own
create policy "Users can select own lists" on public.lists
  for select using (auth.uid() = owner_id);

-- Policy: Users can insert lists they own
create policy "Users can insert own lists" on public.lists
  for insert with check (auth.uid() = owner_id);

-- Policy: Users can update own lists
create policy "Users can update own lists" on public.lists
  for update using (auth.uid() = owner_id);

-- Policy: Users can delete own lists
create policy "Users can delete own lists" on public.lists
  for delete using (auth.uid() = owner_id);


-- 2. List Shares Table (To allow sharing)
create table public.list_shares (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  user_email text not null, -- For MVP sharing by email
  shared_by uuid references auth.users default auth.uid(),
  created_at timestamptz default now()
);

alter table public.list_shares enable row level security;

-- Policy: Owner can see who they shared with
create policy "Owners can view shares" on public.list_shares
  for select using (
    exists (
      select 1 from public.lists
      where lists.id = list_shares.list_id
      and lists.owner_id = auth.uid()
    )
  );

-- Policy: Invited users can see their own share record
create policy "Invited users can view own shares" on public.list_shares
  for select using (
    user_email = auth.jwt() ->> 'email'
  );

-- Policy: Owners can insert shares
create policy "Owners can insert shares" on public.list_shares
  for insert with check (
    exists (
      select 1 from public.lists
      where lists.id = list_id
      and lists.owner_id = auth.uid()
    )
  );

-- Policy: Invited users can "leave" (delete their share)
create policy "Invited users can delete own share" on public.list_shares
  for delete using (
    user_email = auth.jwt() ->> 'email'
  );
  
-- Policy: Owners can delete shares (revoke)
create policy "Owners can delete shares" on public.list_shares
  for delete using (
    exists (
      select 1 from public.lists
      where lists.id = list_id
      and lists.owner_id = auth.uid()
    )
  );


-- 3. Lists Select Policy Update for Shared Lists
-- Need to update lists policy so shared users can SEE the list
create policy "Users can view shared lists" on public.lists
  for select using (
    exists (
      select 1 from public.list_shares
      where list_shares.list_id = lists.id
      and list_shares.user_email = auth.jwt() ->> 'email'
    )
  );


-- 4. List Items Table
create table public.list_items (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  tmdb_id bigint not null,
  title text not null,
  media_type text not null, -- 'movie' or 'tv'
  poster_path text,
  overview text,
  release_year text,
  added_by uuid references auth.users default auth.uid(),
  
  -- Metadata snapshot to avoid joins for simple display
  added_by_email text, 
  
  created_at timestamptz default now()
);

alter table public.list_items enable row level security;

-- Policy: View items if you can view the list (Own or Shared)
create policy "Users can view items in accessible lists" on public.list_items
  for select using (
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and (
        lists.owner_id = auth.uid()
        or exists (
          select 1 from public.list_shares
          where list_shares.list_id = lists.id
          and list_shares.user_email = auth.jwt() ->> 'email'
        )
      )
    )
  );

-- Policy: Add items if you can view the list
create policy "Users can add items to accessible lists" on public.list_items
  for insert with check (
    exists (
      select 1 from public.lists
      where lists.id = list_id
      and (
        lists.owner_id = auth.uid()
        or exists (
          select 1 from public.list_shares
          where list_shares.list_id = lists.id
          and list_shares.user_email = auth.jwt() ->> 'email'
        )
      )
    )
  );

-- Policy: Delete items rules
-- 1. List Owner can delete ANY item
-- 2. Item Creator can delete THEIR OWN item
create policy "Users can delete items based on rules" on public.list_items
  for delete using (
    -- Rule 1: I am the item creator
    added_by = auth.uid()
    OR
    -- Rule 2: I am the list owner
    exists (
      select 1 from public.lists
      where lists.id = list_items.list_id
      and lists.owner_id = auth.uid()
    )
  );


-- 5. Watched Items (Per User)
create table public.watched_items (
  id uuid default gen_random_uuid() primary key,
  list_item_id uuid references public.list_items(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  watched_at timestamptz default now(),
  unique(list_item_id, user_id) -- Unique constraint
);

alter table public.watched_items enable row level security;

create policy "Users can manage own watched status" on public.watched_items
  for all using (user_id = auth.uid());
  
-- Also need to ensure they can only mark items they can access
-- (Supabase FK constraints handle existence, RLS on list_items handles visibility)


-- 6. Item Ratings (Per User)
create table public.item_ratings (
  id uuid default gen_random_uuid() primary key,
  list_item_id uuid references public.list_items(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  rating int check (rating >= 1 and rating <= 5),
  created_at timestamptz default now(),
  unique(list_item_id, user_id) -- One rating per item per user
);

alter table public.item_ratings enable row level security;

create policy "Users can manage own ratings" on public.item_ratings
  for all using (user_id = auth.uid());

-- Helper function to automatically set added_by_email on insert
create or replace function public.set_added_by_email()
returns trigger as $$
begin
  new.added_by_email = auth.jwt() ->> 'email';
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_set_added_by_email
before insert on public.list_items
for each row execute procedure public.set_added_by_email();
