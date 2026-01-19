-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup (optional, but good for keeping data sync if we wanted to auto-create, 
-- but requirements say "Prompt user", so we insert manually. 
-- However, we still need to ensure we can insert.)

-- Add helpful comments
comment on table public.profiles is 'User profiles with display names.';
comment on column public.profiles.id is 'References auth.users.id';
comment on column public.profiles.display_name is 'Public display name for the user.';
