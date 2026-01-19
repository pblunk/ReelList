-- Migration: Add user_email to item_ratings for display purposes

-- 1. Add column
alter table public.item_ratings 
add column user_email text;

-- 2. Update existing rows (Best effort, using auth.users won't work easily here due to permissions)
-- Ideally we just start fresh or relying on client to send email.
-- But we can try to backfill if we have permissions, otherwise just nullable.

-- 3. Update RLS to allow inserting/updating user_email (already covered by "for all using user_id = auth.uid()")
-- But we need to make sure they can't spoof someone else's email?
-- Just like list_shares, we can rely on `auth.jwt() ->> 'email'`.

-- 4. Create trigger to enforce email matches token (Optional but good for integrity)
create or replace function public.set_rating_email()
returns trigger as $$
begin
  new.user_email = auth.jwt() ->> 'email';
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_set_rating_email
before insert or update on public.item_ratings
for each row execute procedure public.set_rating_email();
