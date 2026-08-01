-- WIRE database schema
-- Run this whole file in Supabase: SQL Editor -> New query -> paste -> Run

-- 1. Profiles (one row per user, auto-created on signup)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  handle text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- 2. Dispatches (the posts)
create table if not exists dispatches (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null check (char_length(text) <= 280),
  created_at timestamptz default now()
);

-- 3. Amplifies (reposts) - one per user per dispatch
create table if not exists amplifies (
  dispatch_id bigint references dispatches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (dispatch_id, user_id)
);

-- 4. Flags (likes) - one per user per dispatch
create table if not exists flags (
  dispatch_id bigint references dispatches(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (dispatch_id, user_id)
);

-- 5. Row Level Security: anyone can read, only owners can write their own rows
alter table profiles enable row level security;
alter table dispatches enable row level security;
alter table amplifies enable row level security;
alter table flags enable row level security;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

create policy "dispatches are publicly readable" on dispatches for select using (true);
create policy "users can insert own dispatches" on dispatches for insert with check (auth.uid() = user_id);
create policy "users can delete own dispatches" on dispatches for delete using (auth.uid() = user_id);

create policy "amplifies are publicly readable" on amplifies for select using (true);
create policy "users can amplify as themselves" on amplifies for insert with check (auth.uid() = user_id);
create policy "users can un-amplify their own" on amplifies for delete using (auth.uid() = user_id);

create policy "flags are publicly readable" on flags for select using (true);
create policy "users can flag as themselves" on flags for insert with check (auth.uid() = user_id);
create policy "users can un-flag their own" on flags for delete using (auth.uid() = user_id);

-- 6. Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, name)
  values (
    new.id,
    '@' || split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Enable realtime so new dispatches push to everyone live
alter publication supabase_realtime add table dispatches;
